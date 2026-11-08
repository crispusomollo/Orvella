import csv
import os

templates = {
    'users_template.csv': ['Full Name', 'Email', 'Role', 'Default Password'],
    'patients_template.csv': ['Patient Name', 'Phone Number', 'Patient Number'],
    'products_template.csv': ['Medication Name', 'Generic Formulation', 'Form Category', 'Safety Reorder Level', 'Requires Rx Script'],
    'suppliers_template.csv': ['Wholesaler Name', 'Contact Person', 'Telephone', 'Email Address', 'Physical Address']
}

# Create a directory named templates on your filesystem layers
os.makedirs('public/templates', exist_ok=True)

for filename, columns in templates.items():
    with open(f'public/templates/{filename}', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(columns)
    print(f"Compiled template layout: public/templates/{filename}")
