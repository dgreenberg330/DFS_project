// ============================================================================
// User Properties Tracker - pushes user dimensions to GTM dataLayer
// ============================================================================

'use client';

import { useEffect, useRef } from 'react';
import { setUserProperties } from '@/lib/gtm';

interface UserPropertiesTrackerProps {
  contestSequence: number;
  userCohort: number;
}

/**
 * Client component that pushes user properties to the dataLayer
 * Include this in pages where the user is authenticated
 * Only fires once per page load
 */
export function UserPropertiesTracker({ contestSequence, userCohort }: UserPropertiesTrackerProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (!hasFired.current && (contestSequence > 0 || userCohort > 0)) {
      setUserProperties({
        ...(contestSequence > 0 && { contest_sequence: contestSequence }),
        ...(userCohort > 0 && { user_cohort: userCohort }),
      });
      hasFired.current = true;
    }
  }, [contestSequence, userCohort]);

  return null;
}
