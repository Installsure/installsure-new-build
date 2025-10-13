"""
iCalendar/iCal Feed Generation using icalendar library
Following the goal: "Use icalendar/ics.py for iCal feeds"
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
from icalendar import Calendar, Event, vCalAddress, vText

logger = logging.getLogger(__name__)


class CalendarGenerator:
    """
    iCalendar feed generator for construction project events
    Compatible with Google Calendar, Outlook, Apple Calendar, etc.
    """
    
    @staticmethod
    def create_calendar(
        project_name: str,
        events: List[Dict[str, Any]],
        timezone: str = 'UTC'
    ) -> bytes:
        """
        Create an iCalendar feed with project events
        
        Args:
            project_name: Name of the project
            events: List of event dictionaries with keys:
                - title: Event title
                - description: Event description (optional)
                - start: Start datetime
                - end: End datetime (optional)
                - location: Event location (optional)
                - organizer: Organizer email (optional)
                - attendees: List of attendee emails (optional)
                - status: Event status (TENTATIVE, CONFIRMED, CANCELLED)
            timezone: Timezone for events (default: UTC)
        
        Returns:
            iCalendar file as bytes
        """
        # Create calendar
        cal = Calendar()
        
        # Required properties
        cal.add('prodid', '-//InstallSure//BIM Calendar Service//EN')
        cal.add('version', '2.0')
        cal.add('calscale', 'GREGORIAN')
        cal.add('method', 'PUBLISH')
        
        # Calendar metadata
        cal.add('x-wr-calname', f'{project_name} - Schedule')
        cal.add('x-wr-caldesc', f'Construction schedule for {project_name}')
        cal.add('x-wr-timezone', timezone)
        
        # Add events
        for event_data in events:
            event = Event()
            
            # Required fields
            event.add('summary', event_data.get('title', 'Untitled Event'))
            event.add('dtstart', event_data.get('start', datetime.now()))
            
            # Optional fields
            if 'end' in event_data:
                event.add('dtend', event_data['end'])
            else:
                # Default to 1 hour duration
                event.add('dtend', event_data.get('start', datetime.now()) + timedelta(hours=1))
            
            if 'description' in event_data:
                event.add('description', event_data['description'])
            
            if 'location' in event_data:
                event.add('location', event_data['location'])
            
            # Unique identifier
            event.add('uid', event_data.get('uid', f"{event_data.get('title', 'event')}@installsure.com"))
            
            # Timestamp
            event.add('dtstamp', datetime.now())
            
            # Status
            status = event_data.get('status', 'CONFIRMED').upper()
            if status in ['TENTATIVE', 'CONFIRMED', 'CANCELLED']:
                event.add('status', status)
            else:
                event.add('status', 'CONFIRMED')
            
            # Priority (1=highest, 9=lowest, 0=undefined)
            priority = event_data.get('priority', 5)
            event.add('priority', priority)
            
            # Organizer
            if 'organizer' in event_data:
                organizer = vCalAddress(f'MAILTO:{event_data["organizer"]}')
                organizer.params['cn'] = vText(event_data.get('organizer_name', event_data['organizer']))
                event.add('organizer', organizer)
            
            # Attendees
            if 'attendees' in event_data:
                for attendee_email in event_data['attendees']:
                    attendee = vCalAddress(f'MAILTO:{attendee_email}')
                    attendee.params['role'] = vText('REQ-PARTICIPANT')
                    attendee.params['partstat'] = vText('NEEDS-ACTION')
                    event.add('attendee', attendee)
            
            # Categories/tags
            if 'categories' in event_data:
                event.add('categories', event_data['categories'])
            
            # Add event to calendar
            cal.add_component(event)
        
        logger.info(f"Generated iCalendar with {len(events)} events for project: {project_name}")
        
        # Return as bytes
        return cal.to_ical()
    
    @staticmethod
    def create_milestone_calendar(
        project_name: str,
        milestones: List[Dict[str, Any]]
    ) -> bytes:
        """
        Create a calendar specifically for project milestones
        
        Args:
            project_name: Name of the project
            milestones: List of milestone dictionaries
        
        Returns:
            iCalendar file as bytes
        """
        events = []
        
        for milestone in milestones:
            event = {
                'title': f"🎯 Milestone: {milestone.get('name', 'Unnamed')}",
                'description': milestone.get('description', ''),
                'start': milestone.get('due_date', datetime.now()),
                'end': milestone.get('due_date', datetime.now()),  # All-day event
                'status': milestone.get('status', 'CONFIRMED'),
                'priority': 1,  # High priority for milestones
                'categories': ['MILESTONE', 'CONSTRUCTION'],
            }
            events.append(event)
        
        return CalendarGenerator.create_calendar(project_name, events)
    
    @staticmethod
    def create_inspection_calendar(
        project_name: str,
        inspections: List[Dict[str, Any]]
    ) -> bytes:
        """
        Create a calendar for inspections and quality checks
        
        Args:
            project_name: Name of the project
            inspections: List of inspection dictionaries
        
        Returns:
            iCalendar file as bytes
        """
        events = []
        
        for inspection in inspections:
            event = {
                'title': f"🔍 Inspection: {inspection.get('type', 'General')}",
                'description': inspection.get('notes', ''),
                'start': inspection.get('scheduled_date', datetime.now()),
                'end': inspection.get('scheduled_date', datetime.now()) + timedelta(hours=2),
                'location': inspection.get('location', ''),
                'status': 'CONFIRMED',
                'priority': 3,
                'categories': ['INSPECTION', 'QUALITY_CONTROL'],
                'organizer': inspection.get('inspector_email'),
            }
            
            if 'attendees' in inspection:
                event['attendees'] = inspection['attendees']
            
            events.append(event)
        
        return CalendarGenerator.create_calendar(project_name, events)
    
    @staticmethod
    def create_meeting_calendar(
        project_name: str,
        meetings: List[Dict[str, Any]]
    ) -> bytes:
        """
        Create a calendar for project meetings
        
        Args:
            project_name: Name of the project
            meetings: List of meeting dictionaries
        
        Returns:
            iCalendar file as bytes
        """
        events = []
        
        for meeting in meetings:
            event = {
                'title': f"📅 {meeting.get('title', 'Project Meeting')}",
                'description': meeting.get('agenda', ''),
                'start': meeting.get('start_time', datetime.now()),
                'end': meeting.get('end_time', datetime.now() + timedelta(hours=1)),
                'location': meeting.get('location', 'TBD'),
                'status': 'CONFIRMED',
                'priority': 5,
                'categories': ['MEETING', 'COORDINATION'],
                'organizer': meeting.get('organizer_email'),
            }
            
            if 'attendees' in meeting:
                event['attendees'] = meeting['attendees']
            
            events.append(event)
        
        return CalendarGenerator.create_calendar(project_name, events)


# Example usage
if __name__ == "__main__":
    # Example: Project milestones
    milestones = [
        {
            'name': 'Foundation Complete',
            'description': 'Foundation work completed and inspected',
            'due_date': datetime(2025, 11, 15),
            'status': 'CONFIRMED'
        },
        {
            'name': 'Framing Complete',
            'description': 'Structural framing completed',
            'due_date': datetime(2025, 12, 20),
            'status': 'TENTATIVE'
        },
        {
            'name': 'Final Inspection',
            'description': 'Final building inspection',
            'due_date': datetime(2026, 3, 30),
            'status': 'TENTATIVE'
        }
    ]
    
    # Generate milestone calendar
    ical_bytes = CalendarGenerator.create_milestone_calendar(
        'Sample Construction Project',
        milestones
    )
    
    # Save to file
    with open('project_milestones.ics', 'wb') as f:
        f.write(ical_bytes)
    
    print(f"Milestone calendar generated: project_milestones.ics ({len(ical_bytes)} bytes)")
    
    # Example: Inspections
    inspections = [
        {
            'type': 'Foundation Inspection',
            'notes': 'Inspect foundation before concrete pour',
            'scheduled_date': datetime(2025, 11, 10, 9, 0),
            'location': '123 Construction Site',
            'inspector_email': 'inspector@example.com',
            'attendees': ['pm@example.com', 'contractor@example.com']
        },
        {
            'type': 'Electrical Rough-In',
            'notes': 'Inspect electrical before drywall',
            'scheduled_date': datetime(2025, 12, 15, 14, 0),
            'location': '123 Construction Site',
            'inspector_email': 'inspector@example.com',
        }
    ]
    
    # Generate inspection calendar
    ical_bytes = CalendarGenerator.create_inspection_calendar(
        'Sample Construction Project',
        inspections
    )
    
    # Save to file
    with open('project_inspections.ics', 'wb') as f:
        f.write(ical_bytes)
    
    print(f"Inspection calendar generated: project_inspections.ics ({len(ical_bytes)} bytes)")
