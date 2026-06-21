import * as TaskManager from 'expo-task-manager';
import { LocationObject } from 'expo-location';
import { BACKGROUND_LOCATION_TASK_NAME, locationTracker } from './location_tracker';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocation] task error:', error);
    return;
  }

  const { locations } = (data ?? {}) as { locations: LocationObject[] };
  if (locations?.length) {
    await locationTracker.processBackgroundLocations(locations);
  }
});
