/*
# Seed inventory items with realistic hospital supplies

Populates inventory_items with 20 items across categories:
Medications, Equipment, Supplies, and Lab Reagents.
All prices are in PKR (Pakistani Rupees).
*/

INSERT INTO inventory_items (name, category, sku, quantity, unit, reorder_level, unit_price, supplier, expiry_date, location) VALUES
('Paracetamol 500mg', 'Medication', 'MED-001', 850, 'tablets', 200, 2.50, 'PharmaCorp PK', '2027-06-30', 'Pharmacy A-1'),
('Amoxicillin 250mg', 'Medication', 'MED-002', 420, 'capsules', 150, 8.00, 'PharmaCorp PK', '2026-12-31', 'Pharmacy A-2'),
('Ibuprofen 400mg', 'Medication', 'MED-003', 630, 'tablets', 200, 3.20, 'MediSource PK', '2027-03-15', 'Pharmacy A-1'),
('Insulin Glargine', 'Medication', 'MED-004', 85, 'vials', 30, 450.00, 'Diabetes Care PK', '2026-09-30', 'Cold Storage B-1'),
('Surgical Gloves (M)', 'Supplies', 'SUP-001', 1200, 'boxes', 300, 350.00, 'MedEquip PK', NULL, 'Storage C-1'),
('Surgical Gloves (L)', 'Supplies', 'SUP-002', 800, 'boxes', 300, 350.00, 'MedEquip PK', NULL, 'Storage C-1'),
('Disposable Syringes 5ml', 'Supplies', 'SUP-003', 2500, 'units', 500, 12.00, 'MedEquip PK', NULL, 'Storage C-2'),
('Face Masks N95', 'Supplies', 'SUP-004', 600, 'boxes', 200, 1200.00, 'SafetyFirst PK', NULL, 'Storage C-3'),
('Cotton Roll 500g', 'Supplies', 'SUP-005', 150, 'rolls', 50, 280.00, 'MedEquip PK', NULL, 'Storage C-2'),
('Bandage Roll 4"', 'Supplies', 'SUP-006', 320, 'rolls', 80, 65.00, 'MedEquip PK', NULL, 'Storage C-2'),
('ECG Machine Electrodes', 'Equipment', 'EQP-001', 45, 'packs', 20, 850.00, 'CardioTech PK', NULL, 'Equipment Room'),
('Pulse Oximeter', 'Equipment', 'EQP-002', 12, 'units', 5, 4200.00, 'MedEquip PK', NULL, 'Equipment Room'),
('Blood Pressure Cuff', 'Equipment', 'EQP-003', 18, 'units', 8, 2800.00, 'MedEquip PK', NULL, 'Equipment Room'),
('Stethoscope', 'Equipment', 'EQP-004', 22, 'units', 10, 3500.00, 'MedEquip PK', NULL, 'Equipment Room'),
('IV Drip Set', 'Supplies', 'SUP-007', 480, 'units', 100, 85.00, 'MedEquip PK', NULL, 'Storage C-2'),
('Glucose Test Strips', 'Supplies', 'SUP-008', 350, 'boxes', 100, 650.00, 'Diabetes Care PK', '2026-11-30', 'Pharmacy A-2'),
('Heparin Sodium', 'Medication', 'MED-005', 60, 'vials', 25, 320.00, 'PharmaCorp PK', '2027-01-31', 'Cold Storage B-2'),
('Complete Blood Count Kit', 'Lab Reagent', 'LAB-001', 200, 'kits', 50, 180.00, 'LabTech PK', '2026-08-31', 'Lab Storage'),
('Urine Analysis Strips', 'Lab Reagent', 'LAB-002', 180, 'boxes', 40, 220.00, 'LabTech PK', '2027-02-28', 'Lab Storage'),
('Saline Solution 0.9% 500ml', 'Supplies', 'SUP-009', 540, 'bottles', 150, 95.00, 'PharmaCorp PK', '2027-05-31', 'Storage C-1')
ON CONFLICT (sku) DO NOTHING;
