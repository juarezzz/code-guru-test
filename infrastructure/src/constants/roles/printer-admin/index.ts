type PrinterAdminRoles =
  | 'printer-labels'
  | 'printer-customers'
  | 'printer-customer-products'
  | 'printer-serialised-codes';

type PrinterAdmin = Record<PrinterAdminRoles, string[]>;

export const printer_admin: PrinterAdmin = {
  'printer-labels': ['POST', 'PUT'],
  'printer-customers': ['GET'],
  'printer-customer-products': ['GET'],
  'printer-serialised-codes': ['POST'],
};
