import * as TaskManager from 'expo-task-manager';
import { LocationObject } from 'expo-location';
import { BACKGROUND_LOCATION_TASK_NAME, locationTracker } from './locationTracker';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocation] task error:', error);
    return;
  }

  const { locations } = (data ?? {}) as { locations: LocationObject[] };
  console.log(
    `[BackgroundLocation] task fired at ${new Date().toISOString()} with ${locations?.length ?? 0} location(s)`,
  );
  if (locations?.length) {
    await locationTracker.processBackgroundLocations(locations);
  }
});
