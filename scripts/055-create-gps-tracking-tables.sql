-- GPS Tracking Tables for Staff Performance Monitoring

-- Staff Trips Table: Tracks each trip/journey staff makes
CREATE TABLE IF NOT EXISTS public.staff_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  start_location JSONB, -- {lat, lng, address}
  end_location JSONB,
  total_distance DECIMAL(10, 2), -- miles
  total_drive_time INTEGER, -- minutes
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  route_points JSONB DEFAULT '[]'::jsonb, -- Array of {lat, lng, timestamp}
  estimated_arrival TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Visits Table: Tracks patient visits
CREATE TABLE IF NOT EXISTS public.staff_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.staff_trips(id) ON DELETE SET NULL,
  patient_name TEXT,
  patient_address TEXT,
  visit_type TEXT, -- 'Wound Care', 'Medication Management', etc.
  scheduled_time TIMESTAMPTZ,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration INTEGER, -- minutes (calculated)
  drive_time_to_visit INTEGER, -- minutes from trip start or previous visit
  distance_to_visit DECIMAL(10, 2), -- miles
  visit_location JSONB, -- {lat, lng, address}
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Location Updates Table: Stores GPS pings
CREATE TABLE IF NOT EXISTS public.staff_location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.staff_trips(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2), -- mph
  heading DECIMAL(5, 2), -- degrees
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Performance Stats Table: Daily/weekly aggregates
CREATE TABLE IF NOT EXISTS public.staff_performance_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('day', 'week')),
  total_drive_time INTEGER DEFAULT 0, -- minutes
  total_visits INTEGER DEFAULT 0,
  total_miles DECIMAL(10, 2) DEFAULT 0,
  total_visit_time INTEGER DEFAULT 0, -- minutes
  avg_visit_duration DECIMAL(10, 2) DEFAULT 0,
  efficiency_score INTEGER DEFAULT 0, -- 0-100
  cost_per_mile DECIMAL(10, 2) DEFAULT 0.67, -- default $0.67/mile
  total_cost DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(staff_id, date, period)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_trips_staff ON public.staff_trips(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_trips_status ON public.staff_trips(status);
CREATE INDEX IF NOT EXISTS idx_staff_trips_start_time ON public.staff_trips(start_time);

CREATE INDEX IF NOT EXISTS idx_staff_visits_staff ON public.staff_visits(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_visits_trip ON public.staff_visits(trip_id);
CREATE INDEX IF NOT EXISTS idx_staff_visits_start_time ON public.staff_visits(start_time);
CREATE INDEX IF NOT EXISTS idx_staff_visits_status ON public.staff_visits(status);

CREATE INDEX IF NOT EXISTS idx_location_updates_staff ON public.staff_location_updates(staff_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_trip ON public.staff_location_updates(trip_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_timestamp ON public.staff_location_updates(timestamp);

CREATE INDEX IF NOT EXISTS idx_performance_stats_staff ON public.staff_performance_stats(staff_id);
CREATE INDEX IF NOT EXISTS idx_performance_stats_date ON public.staff_performance_stats(date);

-- Enable RLS
ALTER TABLE public.staff_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_performance_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to read their own data, service role can do everything
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_trips' AND policyname = 'staff_trips_read_own') THEN
    CREATE POLICY "staff_trips_read_own" ON public.staff_trips FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_visits' AND policyname = 'staff_visits_read_own') THEN
    CREATE POLICY "staff_visits_read_own" ON public.staff_visits FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_location_updates' AND policyname = 'location_updates_read_own') THEN
    CREATE POLICY "location_updates_read_own" ON public.staff_location_updates FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_performance_stats' AND policyname = 'performance_stats_read_own') THEN
    CREATE POLICY "performance_stats_read_own" ON public.staff_performance_stats FOR SELECT USING (true);
  END IF;
END $$;

-- Service role can do everything (for API calls)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_trips' AND policyname = 'staff_trips_service_role') THEN
    CREATE POLICY "staff_trips_service_role" ON public.staff_trips FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_visits' AND policyname = 'staff_visits_service_role') THEN
    CREATE POLICY "staff_visits_service_role" ON public.staff_visits FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_location_updates' AND policyname = 'location_updates_service_role') THEN
    CREATE POLICY "location_updates_service_role" ON public.staff_location_updates FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'staff_performance_stats' AND policyname = 'performance_stats_service_role') THEN
    CREATE POLICY "performance_stats_service_role" ON public.staff_performance_stats FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    3959 * acos(
      cos(radians(lat1)) *
      cos(radians(lat2)) *
      cos(radians(lon2) - radians(lon1)) +
      sin(radians(lat1)) *
      sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.staff_trips IS 'Tracks staff trips/journeys with GPS tracking';
COMMENT ON TABLE public.staff_visits IS 'Records patient visits during trips';
COMMENT ON TABLE public.staff_location_updates IS 'GPS location pings during trips';
COMMENT ON TABLE public.staff_performance_stats IS 'Aggregated daily/weekly performance metrics';

