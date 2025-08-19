import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const format = searchParams.get('format') || 'JSON';

    if (!reportType) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      );
    }

    let reportData: any = {};
    let reportTitle = '';

    switch (reportType) {
      case 'PATIENTS':
        reportTitle = 'Patients Report';
        const patients = await db.patient.findMany({
          include: {
            receipts: {
              select: {
                id: true,
                amount: true,
                type: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        reportData = {
          totalPatients: patients.length,
          patients: patients.map(patient => ({
            id: patient.id,
            name: `${patient.firstName} ${patient.lastName}`,
            email: patient.email,
            phone: patient.phone,
            age: patient.age,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            address: patient.address,
            totalReceipts: patient.receipts.length,
            totalAmount: patient.receipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0),
            registeredAt: patient.createdAt
          }))
        };
        break;

      case 'FINANCIAL':
        reportTitle = 'Financial Report';
        const receipts = await db.receipt.findMany({
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        const financialSummary = receipts.reduce((acc, receipt) => {
          acc.totalRevenue += receipt.amount || 0;
          acc.totalTransactions += 1;
          
          if (!acc.byType[receipt.type]) {
            acc.byType[receipt.type] = { count: 0, amount: 0 };
          }
          acc.byType[receipt.type].count += 1;
          acc.byType[receipt.type].amount += receipt.amount || 0;

          if (!acc.byPaymentMethod[receipt.paymentMethod || 'UNKNOWN']) {
            acc.byPaymentMethod[receipt.paymentMethod || 'UNKNOWN'] = { count: 0, amount: 0 };
          }
          acc.byPaymentMethod[receipt.paymentMethod || 'UNKNOWN'].count += 1;
          acc.byPaymentMethod[receipt.paymentMethod || 'UNKNOWN'].amount += receipt.amount || 0;

          return acc;
        }, {
          totalRevenue: 0,
          totalTransactions: 0,
          byType: {} as any,
          byPaymentMethod: {} as any
        });

        reportData = {
          summary: financialSummary,
          receipts: receipts.map(receipt => ({
            id: receipt.id,
            receiptNumber: receipt.receiptNumber,
            patientName: `${receipt.patient.firstName} ${receipt.patient.lastName}`,
            type: receipt.type,
            amount: receipt.amount,
            paymentMethod: receipt.paymentMethod,
            status: receipt.status,
            issuedBy: receipt.user?.name,
            issuedAt: receipt.createdAt
          }))
        };
        break;

      case 'QUEUE':
        reportTitle = 'Queue Management Report';
        const [opdQueues, pharmacyQueues] = await Promise.all([
          db.oPDQueue.findMany({
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }),
          db.pharmacyQueue.findMany({
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          })
        ]);

        const queueSummary = {
          totalOPD: opdQueues.length,
          totalPharmacy: pharmacyQueues.length,
          opdByStatus: opdQueues.reduce((acc, queue) => {
            acc[queue.status] = (acc[queue.status] || 0) + 1;
            return acc;
          }, {} as any),
          pharmacyByStatus: pharmacyQueues.reduce((acc, queue) => {
            acc[queue.status] = (acc[queue.status] || 0) + 1;
            return acc;
          }, {} as any),
          opdByPriority: opdQueues.reduce((acc, queue) => {
            acc[queue.priority] = (acc[queue.priority] || 0) + 1;
            return acc;
          }, {} as any),
          pharmacyByPriority: pharmacyQueues.reduce((acc, queue) => {
            acc[queue.priority] = (acc[queue.priority] || 0) + 1;
            return acc;
          }, {} as any)
        };

        reportData = {
          summary: queueSummary,
          opdQueues: opdQueues.map(queue => ({
            id: queue.id,
            tokenNumber: queue.tokenNumber,
            patientName: `${queue.patient.firstName} ${queue.patient.lastName}`,
            status: queue.status,
            priority: queue.priority,
            departmentId: queue.departmentId,
            calledAt: queue.calledAt,
            servingAt: queue.servingAt,
            completedAt: queue.completedAt,
            createdAt: queue.createdAt
          })),
          pharmacyQueues: pharmacyQueues.map(queue => ({
            id: queue.id,
            tokenNumber: queue.tokenNumber,
            patientName: `${queue.patient.firstName} ${queue.patient.lastName}`,
            status: queue.status,
            priority: queue.priority,
            departmentId: queue.departmentId,
            calledAt: queue.calledAt,
            servingAt: queue.servingAt,
            completedAt: queue.completedAt,
            createdAt: queue.createdAt
          }))
        };
        break;

      case 'MEDICINE':
        reportTitle = 'Medicine Inventory Report';
        const medicines = await db.medicine.findMany({
          orderBy: {
            createdAt: 'desc'
          }
        });

        const inventorySummary = medicines.reduce((acc, medicine) => {
          acc.totalItems += 1;
          acc.totalQuantity += medicine.quantity;
          acc.totalValue += medicine.quantity * medicine.sellingPrice;
          
          if (!acc.byCategory[medicine.category]) {
            acc.byCategory[medicine.category] = { count: 0, quantity: 0, value: 0 };
          }
          acc.byCategory[medicine.category].count += 1;
          acc.byCategory[medicine.category].quantity += medicine.quantity;
          acc.byCategory[medicine.category].value += medicine.quantity * medicine.sellingPrice;

          return acc;
        }, {
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0,
          byCategory: {} as any
        });

        reportData = {
          summary: inventorySummary,
          medicines: medicines.map(medicine => ({
            id: medicine.id,
            name: medicine.name,
            category: medicine.category,
            brand: medicine.brand,
            manufacturer: medicine.manufacturer,
            batchNumber: medicine.batchNumber,
            expiryDate: medicine.expiryDate,
            quantity: medicine.quantity,
            unitPrice: medicine.unitPrice,
            sellingPrice: medicine.sellingPrice,
            totalValue: medicine.quantity * medicine.sellingPrice,
            isActive: medicine.isActive,
            createdAt: medicine.createdAt
          }))
        };
        break;

      case 'STAFF':
        reportTitle = 'Staff Report';
        const users = await db.user.findMany({
          orderBy: {
            createdAt: 'desc'
          }
        });

        const staffSummary = users.reduce((acc, user) => {
          acc.totalStaff += 1;
          acc.byRole[user.role] = (acc.byRole[user.role] || 0) + 1;
          acc.activeStaff += user.isActive ? 1 : 0;
          return acc;
        }, {
          totalStaff: 0,
          activeStaff: 0,
          byRole: {} as any
        });

        reportData = {
          summary: staffSummary,
          staff: users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            isActive: user.isActive,
            createdAt: user.createdAt
          }))
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Log the report generation
    await db.reportLog.create({
      data: {
        reportType,
        title: reportTitle,
        description: `${reportTitle} generated in ${format} format`,
        data: JSON.stringify(reportData),
        format,
        generatedBy: 'admin' // In real app, get from user session
      }
    });

    if (format === 'CSV') {
      // Convert to CSV format
      const csvContent = convertToCSV(reportData);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        report: reportData,
        title: reportTitle,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any): string {
  const flattenObject = (obj: any, prefix = ''): any => {
    const flattened: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value, newKey));
        } else if (Array.isArray(value)) {
          flattened[newKey] = JSON.stringify(value);
        } else {
          flattened[newKey] = value;
        }
      }
    }
    
    return flattened;
  };

  // Extract all possible headers from the data
  const extractHeaders = (obj: any): string[] => {
    const headers = new Set<string>();
    
    const processObject = (item: any) => {
      const flattened = flattenObject(item);
      Object.keys(flattened).forEach(key => headers.add(key));
    };
    
    if (Array.isArray(data)) {
      data.forEach(processObject);
    } else if (typeof data === 'object') {
      Object.values(data).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(processObject);
        }
      });
    }
    
    return Array.from(headers);
  };

  const headers = extractHeaders(data);
  
  // Convert data to rows
  const rows: any[] = [];
  
  if (Array.isArray(data)) {
    data.forEach(item => {
      const flattened = flattenObject(item);
      const row: any = {};
      headers.forEach(header => {
        row[header] = flattened[header] || '';
      });
      rows.push(row);
    });
  } else if (typeof data === 'object') {
    // Handle summary data
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          const flattened = flattenObject(item);
          const row: any = {};
          headers.forEach(header => {
            row[header] = flattened[header] || '';
          });
          rows.push(row);
        });
      }
    });
  }

  // Generate CSV content
  const csvHeaders = headers.join(',');
  const csvRows = rows.map(row => 
    headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma or quote
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}