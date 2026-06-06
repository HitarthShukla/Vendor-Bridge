import { PrismaClient, UserRole, VendorStatus, RfqStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Users ──────────────────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const officerPassword = await bcrypt.hash('Officer@1234', 12);
  const managerPassword = await bcrypt.hash('Manager@1234', 12);
  const vendorPassword = await bcrypt.hash('Vendor@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vendorbridge.com' },
    update: {},
    create: { email: 'admin@vendorbridge.com', password: adminPassword, name: 'System Admin', role: 'ADMIN' },
  });

  const officer1 = await prisma.user.upsert({
    where: { email: 'officer@vendorbridge.com' },
    update: {},
    create: { email: 'officer@vendorbridge.com', password: officerPassword, name: 'Rajesh Kumar', role: 'PROCUREMENT_OFFICER' },
  });

  const officer2 = await prisma.user.upsert({
    where: { email: 'officer2@vendorbridge.com' },
    update: {},
    create: { email: 'officer2@vendorbridge.com', password: officerPassword, name: 'Priya Sharma', role: 'PROCUREMENT_OFFICER' },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@vendorbridge.com' },
    update: {},
    create: { email: 'manager@vendorbridge.com', password: managerPassword, name: 'Amit Patel', role: 'MANAGER' },
  });

  const vendorUser1 = await prisma.user.upsert({
    where: { email: 'vendor1@acme.com' },
    update: {},
    create: { email: 'vendor1@acme.com', password: vendorPassword, name: 'Vikram Singh', role: 'VENDOR' },
  });

  const vendorUser2 = await prisma.user.upsert({
    where: { email: 'vendor2@techsupply.com' },
    update: {},
    create: { email: 'vendor2@techsupply.com', password: vendorPassword, name: 'Sunita Reddy', role: 'VENDOR' },
  });

  const vendorUser3 = await prisma.user.upsert({
    where: { email: 'vendor3@globalparts.com' },
    update: {},
    create: { email: 'vendor3@globalparts.com', password: vendorPassword, name: 'Mohammed Ali', role: 'VENDOR' },
  });

  console.log('✅ Users created');

  // ─── Vendors ────────────────────────────────────────────────────────────────

  const vendor1 = await prisma.vendor.upsert({
    where: { email: 'contact@acmesupplies.com' },
    update: {},
    create: {
      user_id: vendorUser1.id,
      name: 'Vikram Singh',
      company_name: 'Acme Industrial Supplies',
      email: 'contact@acmesupplies.com',
      phone: '9876543210',
      gst_number: '27AABCU9603R1ZM',
      pan_number: 'AABCU9603R',
      category: 'Industrial Equipment',
      address: { street: '123 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
      bank_details: { bankName: 'HDFC Bank', accountNumber: '1234567890', ifscCode: 'HDFC0001234', accountHolderName: 'Acme Industrial Supplies Pvt Ltd' },
      status: 'ACTIVE',
      rating: 4.5,
      total_orders: 15,
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { email: 'info@techsupplyco.com' },
    update: {},
    create: {
      user_id: vendorUser2.id,
      name: 'Sunita Reddy',
      company_name: 'TechSupply Co.',
      email: 'info@techsupplyco.com',
      phone: '9876543211',
      gst_number: '29AADCB2230M1ZP',
      pan_number: 'AADCB2230M',
      category: 'IT Equipment',
      address: { street: '456 Brigade Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' },
      status: 'ACTIVE',
      rating: 4.2,
      total_orders: 8,
    },
  });

  const vendor3 = await prisma.vendor.upsert({
    where: { email: 'sales@globalparts.com' },
    update: {},
    create: {
      user_id: vendorUser3.id,
      name: 'Mohammed Ali',
      company_name: 'Global Parts International',
      email: 'sales@globalparts.com',
      phone: '9876543212',
      gst_number: '07AAECG1234F1Z5',
      pan_number: 'AAECG1234F',
      category: 'Raw Materials',
      address: { street: '789 Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', country: 'India' },
      status: 'ACTIVE',
      rating: 3.8,
      total_orders: 22,
    },
  });

  console.log('✅ Vendors created');

  // ─── Sample RFQ ─────────────────────────────────────────────────────────────

  const rfq1 = await prisma.rfq.create({
    data: {
      rfq_number: 'RFQ-2025-0001',
      title: 'Office IT Equipment Procurement Q3 2025',
      description: 'Procurement of laptops, monitors, and peripherals for the new Bangalore office expansion.',
      status: 'PUBLISHED',
      deadline: new Date('2025-12-31'),
      created_by: officer1.id,
      items: {
        create: [
          { name: 'Laptop - i7, 16GB RAM, 512GB SSD', quantity: 50, unit: 'units', category: 'IT Equipment' },
          { name: '27" 4K Monitor', quantity: 50, unit: 'units', category: 'IT Equipment' },
          { name: 'Wireless Keyboard & Mouse Combo', quantity: 50, unit: 'sets', category: 'Peripherals' },
        ],
      },
      vendors: {
        create: [
          { vendor_id: vendor1.id },
          { vendor_id: vendor2.id },
        ],
      },
    },
  });

  const rfq2 = await prisma.rfq.create({
    data: {
      rfq_number: 'RFQ-2025-0002',
      title: 'Raw Materials for Manufacturing - Steel & Aluminum',
      description: 'Monthly procurement of steel sheets and aluminum bars for production line.',
      status: 'DRAFT',
      deadline: new Date('2025-11-30'),
      created_by: officer1.id,
      items: {
        create: [
          { name: 'Steel Sheet 4mm', quantity: 500, unit: 'kg', category: 'Raw Materials' },
          { name: 'Aluminum Bar 25mm', quantity: 200, unit: 'kg', category: 'Raw Materials' },
        ],
      },
      vendors: {
        create: [{ vendor_id: vendor3.id }],
      },
    },
  });

  console.log('✅ RFQs created');
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('Default credentials:');
  console.log('  Admin:     admin@vendorbridge.com    / Admin@1234');
  console.log('  Officer:   officer@vendorbridge.com  / Officer@1234');
  console.log('  Manager:   manager@vendorbridge.com  / Manager@1234');
  console.log('  Vendor:    vendor1@acme.com          / Vendor@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
