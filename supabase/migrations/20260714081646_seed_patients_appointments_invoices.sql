/*
# Seed patients, medical records, appointments, invoices, activities, and notifications

Populates all remaining tables with realistic hospital data:
- 48 patients with emergency contacts, insurance, allergies, and medical records
- 40 appointments referencing the seeded doctors and patients
- 35 invoices with line items
- 7 activity timeline entries
- 5 notifications

Uses a PL/pgSQL DO block with deterministic data generation for compactness.
*/

DO $$
DECLARE
  i int;
  v_patient_id uuid;
  v_doctor_id uuid;
  v_dob date;
  v_rec_count int;
  v_dept text;
  v_status text;
  v_gender text;
  v_blood text;
  v_first text;
  v_last text;
  v_diag text;
  v_treat text;
  v_allergies text[];
  v_day_offset int;
  v_appt_date timestamptz;
  v_appt_status text;
  v_appt_time text;
  v_appt_type text;
  v_inv_count int;
  v_inv_total numeric;
  v_inv_subtotal numeric;
  v_inv_tax numeric;
  v_inv_discount numeric;
  v_inv_status text;
  v_inv_paid numeric;
  v_inv_method text;
BEGIN
  -- ===== PATIENTS =====
  FOR i IN 1..48 LOOP
    v_gender := CASE WHEN (i % 2 = 0) THEN 'female' ELSE 'male' END;
    v_first := CASE WHEN v_gender = 'male' THEN
      CASE (i % 15) WHEN 0 THEN 'James' WHEN 1 THEN 'Liam' WHEN 2 THEN 'Noah' WHEN 3 THEN 'Ethan' WHEN 4 THEN 'Lucas' WHEN 5 THEN 'Mason' WHEN 6 THEN 'Aiden' WHEN 7 THEN 'Daniel' WHEN 8 THEN 'Henry' WHEN 9 THEN 'Owen' WHEN 10 THEN 'Leo' WHEN 11 THEN 'Caleb' WHEN 12 THEN 'Adam' WHEN 13 THEN 'Marcus' WHEN 14 THEN 'Felix' END
    ELSE
      CASE (i % 15) WHEN 0 THEN 'Emma' WHEN 1 THEN 'Olivia' WHEN 2 THEN 'Sophia' WHEN 3 THEN 'Isabella' WHEN 4 THEN 'Mia' WHEN 5 THEN 'Amelia' WHEN 6 THEN 'Harper' WHEN 7 THEN 'Evelyn' WHEN 8 THEN 'Luna' WHEN 9 THEN 'Aria' WHEN 10 THEN 'Layla' WHEN 11 THEN 'Nora' WHEN 12 THEN 'Zoe' WHEN 13 THEN 'Maya' WHEN 14 THEN 'Chloe' END
    END;
    v_last := CASE (i % 27) WHEN 0 THEN 'Smith' WHEN 1 THEN 'Johnson' WHEN 2 THEN 'Williams' WHEN 3 THEN 'Brown' WHEN 4 THEN 'Jones' WHEN 5 THEN 'Garcia' WHEN 6 THEN 'Miller' WHEN 7 THEN 'Davis' WHEN 8 THEN 'Rodriguez' WHEN 9 THEN 'Martinez' WHEN 10 THEN 'Hernandez' WHEN 11 THEN 'Lopez' WHEN 12 THEN 'Wilson' WHEN 13 THEN 'Anderson' WHEN 14 THEN 'Thomas' WHEN 15 THEN 'Taylor' WHEN 16 THEN 'Moore' WHEN 17 THEN 'Jackson' WHEN 18 THEN 'Martin' WHEN 19 THEN 'Lee' WHEN 20 THEN 'Patel' WHEN 21 THEN 'Kim' WHEN 22 THEN 'Chen' WHEN 23 THEN 'Wang' WHEN 24 THEN 'Nguyen' WHEN 25 THEN 'Khan' WHEN 26 THEN 'Singh' END;
    v_dept := CASE (i % 12) WHEN 0 THEN 'Cardiology' WHEN 1 THEN 'Neurology' WHEN 2 THEN 'Orthopedics' WHEN 3 THEN 'Pediatrics' WHEN 4 THEN 'Dermatology' WHEN 5 THEN 'Oncology' WHEN 6 THEN 'Radiology' WHEN 7 THEN 'Emergency' WHEN 8 THEN 'General Medicine' WHEN 9 THEN 'ENT' WHEN 10 THEN 'Ophthalmology' WHEN 11 THEN 'Urology' END;
    v_status := CASE (i % 4) WHEN 0 THEN 'admitted' WHEN 1 THEN 'outpatient' WHEN 2 THEN 'discharged' WHEN 3 THEN 'emergency' END;
    v_blood := CASE (i % 8) WHEN 0 THEN 'A+' WHEN 1 THEN 'A-' WHEN 2 THEN 'B+' WHEN 3 THEN 'B-' WHEN 4 THEN 'AB+' WHEN 5 THEN 'AB-' WHEN 6 THEN 'O+' WHEN 7 THEN 'O-' END;
    v_dob := make_date(1940 + (i % 70), (i % 12) + 1, (i % 28) + 1);
    v_allergies := CASE WHEN (i % 3 = 0) THEN ARRAY['Penicillin'] WHEN (i % 5 = 0) THEN ARRAY['Peanuts','Latex'] WHEN (i % 7 = 0) THEN ARRAY['Aspirin'] ELSE ARRAY[]::text[] END;

    INSERT INTO patients (
      mrn, first_name, last_name, avatar, date_of_birth, gender, blood_type,
      phone, email, address, city, status, department, admitted_on,
      emergency_contact, insurance, allergies, created_at
    ) VALUES (
      'MRN-' || lpad((10000 + i)::text, 6, '0'),
      v_first, v_last,
      'https://api.dicebear.com/7.x/avataaars/svg?seed=pat-' || v_first || '-' || v_last || '-' || i,
      v_dob, v_gender, v_blood,
      '+1 (555) ' || lpad(((200 + i) % 1000)::text, 3, '0') || '-' || lpad(((1000 + i * 7) % 10000)::text, 4, '0'),
      lower(v_first) || '.' || lower(v_last) || i || '@mail.com',
      ((100 + i * 3) % 9999)::text || ' Maple Ave',
      CASE (i % 10) WHEN 0 THEN 'New York' WHEN 1 THEN 'Los Angeles' WHEN 2 THEN 'Chicago' WHEN 3 THEN 'Houston' WHEN 4 THEN 'Phoenix' WHEN 5 THEN 'Boston' WHEN 6 THEN 'Seattle' WHEN 7 THEN 'Miami' WHEN 8 THEN 'Denver' WHEN 9 THEN 'Atlanta' END,
      v_status, v_dept,
      CASE WHEN v_status = 'admitted' THEN now() - (i % 14 || ' days')::interval ELSE NULL END,
      jsonb_build_object('name', v_first || ' ' || CASE (i % 27) WHEN 0 THEN 'Smith' ELSE 'Guardian' END, 'relation', CASE (i % 5) WHEN 0 THEN 'Spouse' WHEN 1 THEN 'Parent' WHEN 2 THEN 'Sibling' WHEN 3 THEN 'Child' ELSE 'Guardian' END, 'phone', '+1 (555) ' || lpad(((300 + i) % 1000)::text, 3, '0') || '-' || lpad(((2000 + i * 3) % 10000)::text, 4, '0')),
      jsonb_build_object('provider', CASE (i % 6) WHEN 0 THEN 'BlueShield' WHEN 1 THEN 'MediCare Plus' WHEN 2 THEN 'HealthGuard' WHEN 3 THEN 'VitaLife' WHEN 4 THEN 'CareSecure' ELSE 'GlobalHealth' END, 'policy_number', 'POL-' || ((100000 + i * 7) % 999999)::text, 'valid_till', (now() + ((30 + i * 20) || ' days')::interval)::text),
      v_allergies,
      now() - (i || ' days')::interval
    )
    RETURNING id INTO v_patient_id;

    -- Medical records (1-3 per patient)
    v_rec_count := (i % 3) + 1;
    FOR v_day_offset IN 1..v_rec_count LOOP
      v_diag := CASE (i % 12) WHEN 0 THEN 'Hypertension' WHEN 1 THEN 'Type 2 Diabetes' WHEN 2 THEN 'Migraine' WHEN 3 THEN 'Asthma' WHEN 4 THEN 'Arthritis' WHEN 5 THEN 'Fracture' WHEN 6 THEN 'Pneumonia' WHEN 7 THEN 'Gastritis' WHEN 8 THEN 'Anemia' WHEN 9 THEN 'Hypothyroidism' WHEN 10 THEN 'Bronchitis' ELSE 'Appendicitis' END;
      v_treat := CASE (i % 7) WHEN 0 THEN 'Prescribed medication' WHEN 1 THEN 'Physical therapy' WHEN 2 THEN 'Surgery scheduled' WHEN 3 THEN 'Lifestyle changes' WHEN 4 THEN 'Observation' WHEN 5 THEN 'Lab tests ordered' ELSE 'Follow-up in 2 weeks' END;
      INSERT INTO medical_records (patient_id, date, diagnosis, treatment, doctor_name, notes)
      VALUES (
        v_patient_id,
        now() - ((30 + v_day_offset * 90) || ' days')::interval,
        v_diag, v_treat,
        'Dr. ' || CASE (i % 5) WHEN 0 THEN 'Sarah Chen' WHEN 1 THEN 'Michael Patel' WHEN 2 THEN 'David Kim' WHEN 3 THEN 'James Garcia' ELSE 'Rachel Chen' END,
        CASE WHEN (i % 3 = 0) THEN 'Monitor vitals regularly. Patient responsive to treatment.' ELSE NULL END
      );
    END LOOP;

    -- Appointments (for first 40 patients)
    IF i <= 40 THEN
      SELECT id INTO v_doctor_id FROM doctors ORDER BY created_at OFFSET (i % 28) LIMIT 1;
      v_day_offset := CASE WHEN i <= 8 THEN (i % 2) ELSE -20 + (i % 35) END;
      v_appt_date := '2026-07-14T10:00:00'::timestamptz + (v_day_offset || ' days')::interval;
      v_appt_status := CASE
        WHEN v_day_offset < 0 THEN CASE (i % 3) WHEN 0 THEN 'completed' WHEN 1 THEN 'cancelled' ELSE 'no-show' END
        WHEN v_day_offset = 0 THEN CASE (i % 3) WHEN 0 THEN 'scheduled' WHEN 1 THEN 'in-progress' ELSE 'completed' END
        ELSE 'scheduled'
      END;
      v_appt_time := CASE (i % 10) WHEN 0 THEN '09:00' WHEN 1 THEN '09:30' WHEN 2 THEN '10:00' WHEN 3 THEN '10:30' WHEN 4 THEN '11:00' WHEN 5 THEN '14:00' WHEN 6 THEN '14:30' WHEN 7 THEN '15:00' WHEN 8 THEN '15:30' ELSE '16:00' END;
      v_appt_type := CASE (i % 5) WHEN 0 THEN 'consultation' WHEN 1 THEN 'follow-up' WHEN 2 THEN 'emergency' WHEN 3 THEN 'surgery' ELSE 'checkup' END;

      INSERT INTO appointments (
        patient_id, patient_name, patient_avatar, doctor_id, doctor_name, department,
        date, time, duration_min, status, type, reason, room
      ) VALUES (
        v_patient_id,
        v_first || ' ' || v_last,
        'https://api.dicebear.com/7.x/avataaars/svg?seed=pat-' || v_first || '-' || v_last || '-' || i,
        v_doctor_id,
        (SELECT 'Dr. ' || first_name || ' ' || last_name FROM doctors WHERE id = v_doctor_id),
        (SELECT department FROM doctors WHERE id = v_doctor_id),
        v_appt_date, v_appt_time,
        CASE (i % 4) WHEN 0 THEN 15 WHEN 1 THEN 30 WHEN 2 THEN 45 ELSE 60 END,
        v_appt_status, v_appt_type,
        CASE (i % 8) WHEN 0 THEN 'Routine checkup' WHEN 1 THEN 'Chest pain evaluation' WHEN 2 THEN 'Follow-up consultation' WHEN 3 THEN 'Pre-surgery assessment' WHEN 4 THEN 'Post-op review' WHEN 5 THEN 'Lab result discussion' WHEN 6 THEN 'Vaccination' ELSE 'Chronic condition management' END,
        (SELECT room FROM doctors WHERE id = v_doctor_id)
      );
    END IF;

    -- Invoices (for first 35 patients)
    IF i <= 35 THEN
      v_inv_subtotal := 150 + (i % 5) * 200 + (i % 3) * 85;
      v_inv_tax := round(v_inv_subtotal * 0.08);
      v_inv_discount := CASE WHEN (i % 3 = 0) THEN 50 + (i % 3) * 50 ELSE 0 END;
      v_inv_total := v_inv_subtotal + v_inv_tax - v_inv_discount;
      v_inv_status := CASE (i % 4) WHEN 0 THEN 'paid' WHEN 1 THEN 'pending' WHEN 2 THEN 'overdue' ELSE 'partially-paid' END;
      v_inv_paid := CASE WHEN v_inv_status = 'paid' THEN v_inv_total WHEN v_inv_status = 'partially-paid' THEN round(v_inv_total * 0.5) ELSE 0 END;
      v_inv_method := CASE WHEN v_inv_status IN ('paid','partially-paid') THEN CASE (i % 5) WHEN 0 THEN 'cash' WHEN 1 THEN 'card' WHEN 2 THEN 'insurance' WHEN 3 THEN 'online' ELSE 'upi' END ELSE NULL END;

      INSERT INTO invoices (
        invoice_number, patient_id, patient_name, patient_avatar, date, due_date,
        items, subtotal, tax_rate, tax, discount, total, amount_paid, status, payment_method, notes
      ) VALUES (
        'INV-2026-' || lpad(i::text, 4, '0'),
        v_patient_id,
        v_first || ' ' || v_last,
        'https://api.dicebear.com/7.x/avataaars/svg?seed=pat-' || v_first || '-' || v_last || '-' || i,
        now() - ((i % 120) || ' days')::interval,
        now() - ((i % 120) - 30 || ' days')::interval,
        jsonb_build_array(
          jsonb_build_object('id','item_' || i || '_1','description','Consultation Fee','category','Consultation','quantity',1,'unit_price',150),
          CASE WHEN (i % 3 != 0) THEN jsonb_build_object('id','item_' || i || '_2','description','Blood Test (CBC)','category','Laboratory','quantity',1,'unit_price',85) ELSE 'null'::jsonb END,
          CASE WHEN (i % 2 = 0) THEN jsonb_build_object('id','item_' || i || '_3','description','X-Ray Chest','category','Radiology','quantity',1,'unit_price',180) ELSE 'null'::jsonb END,
          CASE WHEN (i % 5 = 0) THEN jsonb_build_object('id','item_' || i || '_4','description','Room Charges (per day)','category','Room','quantity',(i % 3) + 1,'unit_price',350) ELSE 'null'::jsonb END
        ) - 'null',
        v_inv_subtotal, 8, v_inv_tax, v_inv_discount, v_inv_total, v_inv_paid,
        v_inv_status, v_inv_method,
        CASE WHEN (i % 5 = 0) THEN 'Payment due within 30 days of invoice date.' ELSE NULL END
      );
    END IF;
  END LOOP;

  -- ===== ACTIVITIES =====
  INSERT INTO activities (type, title, description, time, user_name, user_avatar) VALUES
  ('appointment', 'New appointment booked', 'Sarah Chen scheduled with Dr. Patel — Cardiology', now() - '2 hours'::interval, 'Maya R.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya'),
  ('admission', 'Patient admitted', 'James Wilson admitted to Emergency ward', now() - '4 hours'::interval, 'System', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sys'),
  ('payment', 'Invoice paid', 'INV-2026-0018 settled via card — $1,840.00', now() - '6 hours'::interval, 'Billing', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bill'),
  ('lab', 'Lab results ready', 'CBC panel results uploaded for MRN-000012', now() - '1 day'::interval, 'Lab Bot', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lab'),
  ('discharge', 'Patient discharged', 'Emma Davis discharged from Orthopedics', now() - '1 day'::interval, 'Dr. Lee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=lee'),
  ('doctor', 'Doctor on leave', 'Dr. Robert Anderson on leave until Jul 18', now() - '2 days'::interval, 'HR', 'https://api.dicebear.com/7.x/avataaars/svg?seed=hr'),
  ('appointment', 'Appointment completed', 'Liam Garcia completed checkup with Dr. Kim', now() - '2 days'::interval, 'Dr. Kim', 'https://api.dicebear.com/7.x/avataaars/svg?seed=kim')
  ON CONFLICT DO NOTHING;

  -- ===== NOTIFICATIONS =====
  INSERT INTO notifications (title, message, time, read, type) VALUES
  ('Emergency case incoming', 'Ambulance ETA 8 minutes — Trauma unit standby', now() - '1 hour'::interval, false, 'error'),
  ('Lab results delayed', 'MRI queue is backed up by 40 minutes', now() - '3 hours'::interval, false, 'warning'),
  ('New patient registered', 'Olivia Martinez added to General Medicine', now() - '5 hours'::interval, false, 'success'),
  ('Inventory restock needed', 'Surgical gloves below threshold (120 units)', now() - '1 day'::interval, true, 'warning'),
  ('Weekly report ready', 'Patient throughput report for Jul 8–14 is available', now() - '1 day'::interval, true, 'info')
  ON CONFLICT DO NOTHING;
END $$;
