export interface pageSelection {
  skip: number;
  limit: number;
}
export interface apiResultFormat {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Array<any>;
  totalData: number;
}

export interface staffholidays {
  title: string;
  holidayDate: number;
  day: string;
  description: string;
}
export interface staffleave {
  employeeName: string;
  leaveType: string;
  from: number;
  to: number;
  noOfDays: number | string;
  reason: string;
  status: string;
  img: string;
}

export interface invoicereport {
  invoiceNumber: string;
  client: string;
  createdDate: number;
  dueDate: number;
  amount: string;
  status: string;
  img: string;
}

export interface hrm {
  sNo:number;
  name: string;
  img: string;
  role: string;
  designation: string;
  department: string;
  phone: string;
  days: string;
  email: string;
  createdDate: string;
  noOfDoctor: string;
  status: string;
}

export interface payroll {
  sNo:number;
  employee: string;
  image: string;
  email: string;
  joiningDate: string;
  role: string;
  salary: string;
  status: string;
}


export interface invoicescancelled {
  invoiceId: string;
  category: string;
  createdOn: string | number;
  invoiceTo: string;
  amount: string;
  cancelledOn: string | number;
  status: string | number;
  img: string;
}
export interface invoicedraft {
  createdOn: string | number;
  invoiceTo: string;
  amount: string;
  img: string;
}
export interface invoiceoverdue {
  invoiceId: string;
  category: string;
  createdOn: string | number;
  invoiceTo: string;
  amount: string | number;
  lastDate: string | number;
  status: string | number;
  img: string;
}
export interface invoicespaid {
  invoiceNumber: string | number;
  category: string;
  createdOn: string | number;
  invoiceTo: string;
  amount: string;
  paidOn: string | number;
  status: string;
  img: string;
}
export interface invoicerecurring {
  invoiceNumber: string;
  category: string;
  createdOn: string | number;
  invoiceTo: string;
  amount: string;
  lastInvoice: string | number;
  nextInvoice: string | number;
  frequency: string | number;
  status: string;
  img: string;
}
export interface doctorlist {
  name: string;
  department: string;
  specialization: string;
  degree: string;
  mobile: string;
  email: string;
  joiningDate: number;
  img: string;
}
export interface schedule {
  doctorName: string;
  department: string;
  availableDays: string;
  availableTime: string | number;
  status: string;
  img: string;
}
export interface providentFund {
  name: string;
  designation: string;
  providentFundType: string;
  employeeShare: string;
  organizationShare: string;
  status: string;
  img: string;
}
export interface taxes {
  taxName: string;
  taxPercentage: string;
  status: string;
  sno: number;
}
export interface appointmentList {
  sNo:number;
  dateTime: string;
  patient: string;
  mode: string;
  status: string;
  img: string;
  phone:string;
  doctorName:string;
  designation:string;
}

export interface prescription {
    sNo:number;
    img:string;
    prescriptionId: string;
    patient: string;
    prescribedOn: string;
    doctorName:string
    designation:string
}
export interface invoices {
  sNo:number;
    invoiceId: string;
    description: string;
    createdDate: string;
    dueDate: string;
    amount: string;
    status: string;
}
export interface leaveRequest {
  sNo:number;
    date: string;
    leaveType: string;
    day: string;
    appliedOn: string;
    status: string;
}

export interface review {
  sNo:number;
  star:number;
    img: string;
    reviewedBy: string;
    review: string;
    date: string;
}

export interface doctorInfo {
    sNo:number;
    img:string;
    doctorName: string;
    phone: string;
    lastVisit: string;
  }
  export interface infoList {
    sNo:number;
    img:string;
    name: string;
    designation: string;
    department: string;
    phone: string;
    email: string;
    fees: string;
    status: string;
    
}
export interface patientList {
    sNo:number;
    img: string;
    img2: string;
    name2: string;
    age: number;
    gender: string;
    phone: string;
    designation: string;
    name: string;
    address: string;
    lastVisit: string;
    status: string;
    datetime:string;
    mode:string;
}
export interface leaveList {
  sNo:number;
  id: string;
  employee: string;
  image: string;
  leaveType: string;
  date: string;
  day: string;
  appliedOn: string;
  status: string;
}


export interface assetsList {
    sNo:number;
    img:string;
    assetId: string;
    assetUser: string;
    assetName: string;
    purchaseDate: string;
    warranty: string;
    warrantyEnd: string;
    amount: string;
    status: string;
}


export interface specialization {
    sNo:number;
    img:string;
    specialization: string;
    createdDate: string;
    noOfDoctor: string;
    status: string;
}

export interface service {
  sNo:number;
    serviceName: string;
    department: string;
    price: string;
    status: string;
}


export interface exponsesreport {
  item: string;
  purchaseFrom: string;
  purchaseBy: string;
  paidBy: string;
  date: number;
  amount: string;
  status: string;
  img: string;
}
export interface patientDashboard {
  doctorName: string;
  diagnosis: string;
  date: number;
  img: string;
  status: string;
}

export interface reports {
    sNo:number;
    patient: string;
    ageGender: string;
    contactInfo: string;
    email: string;
    practioner: string;
    location: string;
    lastVisit: string;
    status: string;
    income: string;
    amount: string;
    date: string;
    receivedFrom: string;
    paymentMethod: string;
    expense: string;
    category: string;
    purchasedBy: string;
    dateTime: string;
    invoiceID: string;
}
export interface deleteAccount{
    sNo:number;  
    user:string;
    img: string;
    requisitionDate: string;
    deleteRequestDate: string;
    status: string;
}
export interface contactList{
  sNo:number;
  isSelected?:boolean;
   Image: string;
   Name: string;
   Email: string;
   Phone: string;
   Role: string;
   Status: string;
}
export interface invoice {
  sNo:number;
  isSelected?:boolean;
  Invoice: string;
  Image: string;
  Name: string;
  Email: string;
  Created_On: string;
  Total: string;
  Amount_Due: string;
  Due_Date: string;
  Status: string;
}
export interface staffList {
  name: string;
  department: string;
  specialization: string;
  degree: string;
  mobile: string;
  email: string;
  joiningDate: number;
  img: string;
}
export interface patientsList {
  name: string;
  department: string;
  specialization: string;
  degree: string;
  mobile: string;
  email: string;
  joiningDate: number;
  img: string;
}
export interface datatable {
  name: string;
  position: string;
  office: string;
  age: number;
  startDate: number;
  salary: number;
}
export interface payments {
  invoiceNumber: string;
  patient: string;
  paymentType: string;
  paidDate: number;
  paidAmount: string;
  status: string;
  img: string;
}
export interface departmentList {
  department: string;
  departmentHead: string;
  description: string;
  date: number;
  status: string;
  img: string;
}
export interface datatables {
  name: string;
  position: string;
  office: string;
  age: number;
  startDate: number;
  salary: string;
}
export interface blogs {
  img1: string;
  img2: string;
  heading5: string;
  count1: string;
  count2: string;
  date: number | string;
  heading4: string;
  name: string;
  heading3: string;
  paragraph: string;
  msg: string;
}
export interface recentPatients {
  no: string;
  patientName: string;
  age: number | string;
  date: string | number;
  dateOfBirth: string | number;
  diagnosis: string;
  img: string;
  triage: string;
}
export interface upcomingAppointments {
  no: string;
  patientName: string;
  doctor: string;
  date: string | number;
  time: string | number;
  disease: string;
  img: string;
}
export interface income {
  sNo:number;
  IncomeName: string;
  Amount: string;
  Date: string;
  Image: string;
  ReceivedFrom: string;
  PaymentMethod: string;
  Status: string;
}
export interface payments {
  sNo:number;
  InvoiceID: string;
  Patient: string;
  Image: string;
  DoctorImage: string;
  Doctor: string;
  Position: string;
  PaidDate: string;
  Amount: string;
  PaymentMethod: string;
  Status: string;
}
export interface transactions {
  sNo:number;
  TransactionID: string;
  Patient: string;
  Image: string;
  Description: string;
  PaidDate: string;
  PaymentMethod: string;
  Amount: string;
  Status: string;
}
export interface expenses {
  sNo:number;
  Expense: string;
  Category: string;
  Amount: string;
  Date: string;
  Image: string;
  PurchasedBy: string;
  PaymentMethod: string;
  Status: string;
}
export interface expensecategory {
  sNo:number;
  Category: string;
  Status: string;
}
export interface invoices {
  sNo:number;
  InvoiceID: string;
  Patient: string;
  Image: string;
  CreatedDate: string;
  DueDate: string;
  Amount: string;
  Status: string;
}
export interface pages {
  sNo:number;
  Page: string;
  PageSlug: string;
  Status: string;
}
export interface contactmessages {
  sNo:number;
  Name: string;
  Phone: string;
  Email: string;
  Image: string;
  Message: string;
  CreatedOn: string;
}
export interface tickets {
  sNo:number;
  TicketID: string;
  CreatedBy: string;
  Image: string;
  Subject: string;
  CreatedDate: string;
  Priority: string;
  Assignee: string;
  Status: string;
}
export interface newsletters {
  sNo:number;
  Email: string;
  CreatedOn: string;
}
export interface announcements {
  sNo:number;
  CreatedOn: string;
  Announcement: string;
  Content: string;
  Type: string;
  Status: string;
}
export interface socialLinks {
  icon: string;
  placeholder: string;
}
export interface patientProfile {
  date: number | string;
  doctor: string;
  treatment: string;
  charges: string;
}
export interface invoicesGrid {
  invoiceNumber: string;
  name: string;
  img: string;
  amount: string;
  amounts: string | number;
  text: string;
  dueDate: string | number;
  status: string;
}
export interface SubMenu {
  menuValue: string;
  hasSubRouteTwo2?:boolean;
  route?: string;
  base?: string;
subMenus?: SubMenu[];
}
export interface MenuItem {
  menuValue: string;
  hasSubRoute: boolean;
  showSubRoute: boolean;
  hasSubRouteTwo2?:boolean;
  base: string;
 
  route?: string;
  img?: string;
  icon?: string;
  faIcon?: boolean;
  subMenus: SubMenu[];
  
}

export interface SideBarData {
  tittle: string;
  showAsTab: boolean;
  separateRoute: boolean;
  menu: MenuItem[];
} 
  

