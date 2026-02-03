# Timetable Features

## New Configuration Options

The timetable component now includes two new configuration options that can be accessed through the Settings dialog:

### 1. Show All Subjects

- **Purpose**: When enabled, this option shows all available subjects in the subject selection dropdown, not just the ones currently used in the timetable.
- **Benefit**: Allows users to easily assign any subject to any time slot, even if it's not currently scheduled.
- **Usage**:
  - Enable this option in the Settings dialog
  - Double-click on any timetable cell to edit the subject
  - The subject selector will show all available subjects plus custom input option

### 2. Display Fallback Data

- **Purpose**: When enabled, this option displays fallback timetable data when the main data source is unavailable or incomplete.
- **Benefit**: Ensures the timetable always shows something useful, even during data loading or when the server is unavailable.
- **Usage**:
  - Enable this option in the Settings dialog
  - Fallback data will automatically be used when main data is missing
  - Fallback data includes a complete 5-day schedule with common subjects

## Subject Editing

### How to Edit Subjects

1. **Enable subject editing**: Make sure you have the necessary permissions
2. **Double-click**: Double-click on any timetable cell to open the subject editor
3. **Select subject**: Choose from available subjects or enter a custom name
4. **Save changes**: Click Save to apply the changes

### Subject Selection Features

- **Dropdown selection**: Choose from existing subjects in the timetable
- **All subjects**: When "Show All Subjects" is enabled, see all available subjects
- **Custom input**: Enter custom subject names for special cases
- **Smart filtering**: Subjects are automatically sorted and deduplicated

## Visual Indicators

The timetable header now shows visual indicators for active options:

- **Blue badge**: "All Subjects" when showAllSubjects is enabled
- **Green badge**: "Fallback Data" when displayFallbackData is enabled

## Configuration

### Accessing Settings

1. Click the gear icon or "Settings" button in the timetable interface
2. Configure the new options:
   - Check "Show all subjects in subject selection"
   - Check "Display fallback data when main data is unavailable"
3. Click Save to apply changes

### Default Values

- **Show All Subjects**: Disabled by default
- **Display Fallback Data**: Disabled by default

## Technical Details

### Fallback Data Structure

The fallback data includes:

- 5 working days (Monday to Friday)
- 7 periods per day (8:30 AM to 4:10 PM)
- Lunch break after period 4
- Common subjects: Mathematics, Science, English, History, etc.
- Sample teacher assignments

### Data Persistence

- Configuration options are saved to cookies
- Teacher information overrides are stored locally
- Subject changes are logged but require server implementation for persistence

## Future Enhancements

Planned improvements:

- Server-side subject change persistence
- Subject templates and presets
- Advanced conflict detection
- Bulk subject editing
- Import/export functionality
