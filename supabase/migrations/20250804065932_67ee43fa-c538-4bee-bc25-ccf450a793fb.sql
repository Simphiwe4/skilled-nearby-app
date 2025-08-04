-- Add default locations for testing (Pretoria area addresses)
UPDATE profiles 
SET location = CASE 
  WHEN first_name = 'Mbali' THEN 'Centurion, Pretoria'
  WHEN first_name = 'Bafana' THEN 'Brooklyn, Pretoria'
  WHEN first_name = 'Kgotso' THEN 'Hatfield, Pretoria'
  WHEN first_name = 'Palesa' THEN 'Menlyn, Pretoria'
  WHEN first_name = 'Sipho' THEN 'Arcadia, Pretoria'
  WHEN first_name = 'Nomsa' THEN 'Lynnwood, Pretoria'
  WHEN first_name = 'Thabo' THEN 'Waterkloof, Pretoria'
  WHEN first_name = 'Lindiwe' THEN 'Garsfontein, Pretoria'
  WHEN first_name = 'John' THEN 'Faerie Glen, Pretoria'
  WHEN first_name = 'Sarah' THEN 'Moreleta Park, Pretoria'
  ELSE COALESCE(location, 'Pretoria Central, Pretoria')
END
WHERE location IS NULL OR location = '';