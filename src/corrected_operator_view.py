@api_view(['GET'])
def operator_reports_by_name(request, operator_name):
    """
    Generate detailed performance report for a specific operator.
    
    Parameters:
        operator_name: Name of the operator to generate report for
        from_date (optional): Start date filter (YYYY-MM-DD)
        to_date (optional): End date filter (YYYY-MM-DD)
        
    Returns:
        Comprehensive operator performance metrics including:
        - Production vs non-production time
        - Sewing speed
        - Stitch count
        - Needle runtime
        - Daily breakdown in table format
    """
    try:
        if operator_name == "All":
            operator = Operator.objects.all()
            logs = MachineLog.objects.all()
        else:
            # Fetch operator by name
            operator = Operator.objects.get(operator_name=operator_name)
            logs = MachineLog.objects.filter(OPERATOR_ID=operator.rfid_card_no)    
       
    except Operator.DoesNotExist:
        return Response({"error": "Operator not found"}, status=404)

    # Get date filters from query parameters
    from_date_str = request.GET.get('from_date', '')
    to_date_str = request.GET.get('to_date', '')

    # Apply date filtering if dates are provided
    if from_date_str:
        from_date = datetime.strptime(from_date_str, '%Y-%m-%d').date()
        logs = logs.filter(DATE__gte=from_date)

    if to_date_str:
        to_date = datetime.strptime(to_date_str, '%Y-%m-%d').date()
        logs = logs.filter(DATE__lte=to_date)

    # Exclude records where OPERATOR_ID is 0 AND MODE is 2
    logs = logs.exclude(Q(OPERATOR_ID=0) & Q(MODE=2))

    # Calculate duration in hours for each log entry with time constraints (8:25 AM to 7:35 PM)
    logs = logs.annotate(
        start_seconds=ExpressionWrapper(
            ExtractHour('START_TIME') * 3600 + 
            ExtractMinute('START_TIME') * 60 + 
            ExtractSecond('START_TIME'),
            output_field=FloatField()
        ),
        end_seconds=ExpressionWrapper(
            ExtractHour('END_TIME') * 3600 + 
            ExtractMinute('END_TIME') * 60 + 
            ExtractSecond('END_TIME'),
            output_field=FloatField()
        ),
        # Calculate adjusted start and end times within working hours (8:25 AM to 7:35 PM)
        adjusted_start_seconds=Case(
            When(start_seconds__lt=30300, then=Value(30300)),  # 8:25 AM (8.416667 * 3600)
            When(start_seconds__gt=70500, then=Value(70500)),  # 7:35 PM (19.583333 * 3600)
            default=F('start_seconds'),
            output_field=FloatField()
        ),
        adjusted_end_seconds=Case(
            When(end_seconds__lt=30300, then=Value(30300)),  # 8:25 AM (8.416667 * 3600)
            When(end_seconds__gt=70500, then=Value(70500)),  # 7:35 PM (19.583333 * 3600)
            default=F('end_seconds'),
            output_field=FloatField()
        ),
        # Calculate duration only for the time within working hours
        duration_hours=Case(
            # Case when both start and end are outside working hours
            When(
                Q(end_seconds__lte=30300) | Q(start_seconds__gte=70500),
                then=Value(0)
            ),
            # Case when log spans working hours
            default=ExpressionWrapper(
                (F('adjusted_end_seconds') - F('adjusted_start_seconds')) / 3600,
                output_field=FloatField()
            ),
            output_field=FloatField()
        ),
        reserve_numeric=Cast('RESERVE', output_field=IntegerField())
    ).filter(duration_hours__gt=0)  # Only include logs with positive duration within working hours

    # Filter for working hours (8:25 AM to 7:35 PM)
    logs = logs.filter(
        start_seconds__gte=30300,  # 8:25 AM (8.416667 * 3600)
        end_seconds__lte=70500     # 7:35 PM (19.583333 * 3600)
    )

    # Exclude specific break periods (entirely within these ranges)
    logs = logs.exclude(
        Q(start_seconds__gte=37800, end_seconds__lte=38400) |  # 10:30-10:40
        Q(start_seconds__gte=48000, end_seconds__lte=50400) |  # 13:20-14:00
        Q(start_seconds__gte=58800, end_seconds__lte=59400)    # 16:20-16:30
    )

    # Calculate total working days
    distinct_dates = logs.values('DATE').distinct()
    total_working_days = distinct_dates.count()
    
    # Get today's date
    today = datetime.now().date()
    
    # Calculate the total available hours dynamically
    total_available_hours = 0
    
    for entry in distinct_dates:
        date_entry = entry['DATE']
        
        # Check if this date is today
        if date_entry == today:
            # For today, calculate hours from 8:25 AM to current time
            current_time = datetime.now().time()
            current_seconds = current_time.hour * 3600 + current_time.minute * 60 + current_time.second
            
            # Start time is 8:25 AM (30300 seconds)
            start_seconds = 30300
            
            # End time is the minimum of current time or end of workday (7:35 PM)
            end_seconds = min(current_seconds, 70500)
            
            # If current time is before workday start, set hours to 0
            if current_seconds < start_seconds:
                day_hours = 0
            else:
                # Calculate hours for today
                day_hours = (end_seconds - start_seconds) / 3600
                
                # Subtract break times if they've already passed
                if current_seconds > 38400:  # After 10:40 AM
                    day_hours -= 10/60  # Subtract 10 minutes for first break
                
                if current_seconds > 50400:  # After 2:00 PM
                    day_hours -= 40/60  # Subtract 40 minutes for second break
                
                if current_seconds > 59400:  # After 4:30 PM
                    day_hours -= 10/60  # Subtract 10 minutes for third break
        else:
            # For past dates, use the full day hours (8:25 AM to 7:35 PM minus breaks)
            day_hours = ((70500 - 30300) / 3600) - 1  # 10.17 hours
        
        total_available_hours += day_hours

    # Calculate total hours for each mode
    mode_hours = logs.values('MODE').annotate(
        total_hours=Sum('duration_hours')
    )

    # Initialize hour counters
    total_production_hours = 0
    total_meeting_hours = 0
    total_no_feeding_hours = 0
    total_maintenance_hours = 0

    # Sum hours for each mode
    for mode in mode_hours:
        if mode['MODE'] == 1:  # Sewing (Production)
            total_production_hours = mode['total_hours'] or 0
        elif mode['MODE'] == 4:  # Meeting
            total_meeting_hours = mode['total_hours'] or 0
        elif mode['MODE'] == 3:  # No Feeding
            total_no_feeding_hours = mode['total_hours'] or 0
        elif mode['MODE'] == 5:  # Maintenance
            total_maintenance_hours = mode['total_hours'] or 0

    # Calculate total idle hours
    total_idle_hours = max(total_available_hours - (
        total_production_hours + 
        total_no_feeding_hours + 
        total_meeting_hours + 
        total_maintenance_hours
    ), 0)

    # Calculate non-productive time components
    total_non_production_hours = (
        total_no_feeding_hours + 
        total_meeting_hours + 
        total_maintenance_hours + 
        total_idle_hours
    )

    # Calculate percentages
    production_percentage = (total_production_hours / total_available_hours * 100) if total_available_hours > 0 else 0
    npt_percentage = (total_non_production_hours / total_available_hours * 100) if total_available_hours > 0 else 0

    # Calculate Average Sewing Speed
    valid_speed_logs = logs.filter(reserve_numeric__gt=0)
    average_sewing_speed = valid_speed_logs.aggregate(
        avg_speed=Avg('reserve_numeric')
    )['avg_speed'] or 0

    # Calculate total stitch count
    total_stitch_count = logs.aggregate(
        total=Sum('STITCH_COUNT', default=0)
    )['total'] or 0

    # Calculate Needle Runtime metrics
    sewing_logs = logs.filter(MODE=1)  # Only sewing mode logs
    total_needle_runtime = sewing_logs.aggregate(
        total_runtime=Sum('NEEDLE_RUNTIME', default=0)
    )['total_runtime'] or 0
    
    needle_runtime_instances = sewing_logs.count()
    average_needle_runtime = total_needle_runtime / needle_runtime_instances if needle_runtime_instances > 0 else 0
    
    # Convert needle runtime from seconds to hours for percentage calculation
    total_needle_runtime_hours = total_needle_runtime / 3600
    needle_runtime_percentage = (total_needle_runtime_hours / total_production_hours * 100) if total_production_hours > 0 else 0

    # Fetch Table Data (daily breakdown)
    table_data = logs.values('DATE', 'OPERATOR_ID', 'MODE').annotate(
        sewing_hours=Sum(Case(
            When(MODE=1, then=F('duration_hours')),
            default=Value(0),
            output_field=FloatField()
        )),
        meeting_hours=Sum(Case(
            When(MODE=4, then=F('duration_hours')),
            default=Value(0),
            output_field=FloatField()
        )),
        no_feeding_hours=Sum(Case(
            When(MODE=3, then=F('duration_hours')),
            default=Value(0),
            output_field=FloatField()
        )),
        maintenance_hours=Sum(Case(
            When(MODE=5, then=F('duration_hours')),
            default=Value(0),
            output_field=FloatField()
        )),
        total_stitch_count=Sum('STITCH_COUNT'),
        sewing_speed=Avg(Case(
            When(reserve_numeric__gt=0, then=F('reserve_numeric')),
            default=Value(0),
            output_field=FloatField()
        )),
        needle_runtime=Sum('NEEDLE_RUNTIME')
    ).order_by('DATE', 'OPERATOR_ID')
    
    mode_description_mapping = MODES

    # Now format the data, fetching operator name from the Operator model
    formatted_table_data = []
    for data in table_data:
        # Get operator details from the Operator model
        try:
            operator = Operator.objects.get(rfid_card_no=data['OPERATOR_ID'])
            operator_name = operator.operator_name
            rfid_card_no = operator.rfid_card_no
        except Operator.DoesNotExist:
            operator_name = "Unknown"
            rfid_card_no = "Unknown"
        
        # Get the mode description from the mapping
        mode_description = mode_description_mapping.get(data['MODE'], "N/A")
        
        # Get the date from the data
        entry_date = data['DATE']
        
        # Calculate total available hours for this day
        day_total_hours = 0
        
        # Check if this date is today
        if entry_date == today:
            # For today, calculate hours from 8:25 AM to current time
            current_time = datetime.now().time()
            current_seconds = current_time.hour * 3600 + current_time.minute * 60 + current_time.second
            
            # Start time is 8:25 AM (30300 seconds)
            start_seconds = 30300
            
            # End time is the minimum of current time or end of workday (7:35 PM)
            end_seconds = min(current_seconds, 70500)
            
            # If current time is before workday start, set hours to 0
            if current_seconds < start_seconds:
                day_total_hours = 0
            else:
                # Calculate hours for today
                day_total_hours = (end_seconds - start_seconds) / 3600
                
                # Subtract break times if they've already passed
                if current_seconds > 38400:  # After 10:40 AM
                    day_total_hours -= 10/60  # Subtract 10 minutes for first break
                
                if current_seconds > 50400:  # After 2:00 PM
                    day_total_hours -= 40/60  # Subtract 40 minutes for second break
                
                if current_seconds > 59400:  # After 4:30 PM
                    day_total_hours -= 10/60  # Subtract 10 minutes for third break
        else:
            # For past dates, use the full day hours (8:25 AM to 7:35 PM minus breaks)
            day_total_hours = ((70500 - 30300) / 3600) - 1  # 10.17 hours
        
        # Calculate sewing and non-sewing hours
        sewing_hours = data['sewing_hours'] or 0
        meeting_hours = data['meeting_hours'] or 0
        no_feeding_hours = data['no_feeding_hours'] or 0
        maintenance_hours = data['maintenance_hours'] or 0
        
        # Calculate idle hours as the remainder
        idle_hours = max(day_total_hours - (sewing_hours + meeting_hours + no_feeding_hours + maintenance_hours), 0)
        
        # Calculate percentages
        productive_time_percentage = (sewing_hours / day_total_hours * 100) if day_total_hours > 0 else 0
        npt_percentage = 100 - productive_time_percentage
        
        formatted_table_data.append({
            'Date': str(entry_date),
            'Operator ID': data['OPERATOR_ID'],
            'Operator Name': operator_name,
            'Mode': data['MODE'],
            'Mode Description': mode_description,
            'Total Hours': round(day_total_hours, 2),
            'Sewing Hours': round(sewing_hours, 2),
            'Idle Hours': round(idle_hours, 2),
            'Meeting Hours': round(meeting_hours, 2),
            'No Feeding Hours': round(no_feeding_hours, 2),
            'Maintenance Hours': round(maintenance_hours, 2),
            'Productive Time in %': round(productive_time_percentage, 2),
            'NPT in %': round(npt_percentage, 2),
            'Sewing Speed': round(data['sewing_speed'] or 0, 2),
            'Stitch Count': data['total_stitch_count'] or 0,
            'Needle Runtime': data['needle_runtime'] or 0
        })

    return Response({
        "totalProductionHours": round(total_production_hours, 2),
        "totalNonProductionHours": round(total_non_production_hours, 2),
        "totalIdleHours": round(total_idle_hours, 2),
        "productionPercentage": round(production_percentage, 2),
        "nptPercentage": round(npt_percentage, 2),
        "averageSewingSpeed": round(average_sewing_speed, 2),
        "totalStitchCount": total_stitch_count,
        "totalNeedleRuntime": round(average_needle_runtime, 2),
        "needleRuntimePercentage": round(needle_runtime_percentage, 2),
        "tableData": formatted_table_data,
        "totalHours": round(total_available_hours, 2),
        "totalPT": round(total_production_hours, 2),
        "totalNPT": round(total_non_production_hours, 2)
    })
