import { Injectable } from '@angular/core';
import { routes } from '../routes/routes';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { apiResultFormat, MenuItem, SideBarData } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {
    this.sideBar = this.buildProjectSidebar();
    this.getSideBarData.next(this.sideBar);
  }

  private buildProjectSidebar(): SideBarData[] {
    return [
      {
        tittle: '',
        showAsTab: false,
        separateRoute: false,
        menu: [
          {
            menuValue: 'Dashboard',
            labelKey: 'sidebar.dashboard',
            hasSubRoute: false,
            showSubRoute: false,
            route: routes.index,
            base: 'index',
            icon: 'layout-dashboard',
            subMenus: [],
          },
          {
            menuValue: 'Clientes',
            labelKey: 'sidebar.clients',
            hasSubRoute: false,
            showSubRoute: false,
            route: routes.clients,
            base: 'clients',
            icon: 'users',
            subMenus: [],
          },
          {
            menuValue: 'Servicios',
            labelKey: 'sidebar.services',
            hasSubRoute: false,
            showSubRoute: false,
            route: routes.services,
            base: 'services',
            icon: 'stethoscope',
            subMenus: [],
          },
          {
            menuValue: 'Citas',
            labelKey: 'sidebar.appointments',
            hasSubRoute: false,
            showSubRoute: false,
            route: routes.appointment,
            base: 'appointment',
            icon: 'calendar',
            subMenus: [],
          },
          {
            menuValue: 'Usuarios',
            labelKey: 'sidebar.users',
            hasSubRoute: false,
            showSubRoute: false,
            route: routes.users,
            base: 'users',
            icon: 'user-cog',
            subMenus: [],
          },
        ],
      },
    ];
  }


  //New
  public getDataTables() {
    return this.http.get<apiResultFormat>('assets/json/data-tables.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDoctorAppointmentList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/doctor-appointment-list.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getDoctorPrescription(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/doctor-prescription.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getDoctorLeave(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/doctor-leave.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDoctorReview(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/doctor-review.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPatientAppointment(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/patient-appointment.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPatientDoctor(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/patient-doctor.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPatientInvoices(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/patient-invoices.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPatientPrescription(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/patient-prescription.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getDoctorList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/doctor-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDoctorSchedule(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/doctor-schedule.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPatientList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/patient-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getAppointmentList(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/appointment-list.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getAsset(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/assets-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getSpecialization(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/specializations.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getServices(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/services.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getIncomeReport(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/income-report.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getExpenseReport(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/expense-report.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getAppointmentReport(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/appointment-report.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getPatientReport(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/patient-report.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getIncome(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/income.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPayments(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/payments.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getTransactions(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/transactions.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getExpenses(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/expenses.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getExpensescategory(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/expense-category.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getInvoices(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/invoices.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPages(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/pages.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getContactmessages(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/contact-messages.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getTickets(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/tickets.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getAnnouncements(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/announcements.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getNewsletters(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/newsletters.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDeleteAccount(): Observable<apiResultFormat> {
    return this.http
      .get<apiResultFormat>('assets/json/delete-account.json')
      .pipe(
        map((res: apiResultFormat) => {
          return res;
        })
      );
  }
  public getContacts(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/contacts.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getInvoice(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/invoice.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDepartments(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/departments.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getDesignations(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/designations.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getHolidays(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/holidays.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getPayroll(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/payroll.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getStaffs(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/staffs.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }
  public getLeavList(): Observable<apiResultFormat> {
    return this.http.get<apiResultFormat>('assets/json/leave-list.json').pipe(
      map((res: apiResultFormat) => {
        return res;
      })
    );
  }

  public sideBar: any[] = [
    {
      tittle: 'Main',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Dashboard',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'index',
          route: 'dashboard',
          icon: 'layout-dashboard',
          subMenus: [
            {
              menuValue: 'Admin Dashboard',
              route: routes.index,
              base: 'index',
              separateRoute: true,
            },
            {
              menuValue: 'Doctor Dashboard',
              route: routes.doctorDashboard,
              base: 'doctors',
              separateRoute: true,
            },
            {
              menuValue: 'Patient Dashboard',
              route: routes.patientDashboard,
              base: 'patients',
              separateRoute: true,
            },
          ],
        },
        {
          menuValue: 'Application',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'application',
          icon: 'apps',
          subMenus: [
            {
              separateRoute: true,
              menuValue: 'Chat',
              tittle: 'Chat',
              route: routes.chat,
              base: 'chat',
              showAsTab: false,
            },
            {
              menuValue: 'Calls',
              hasSubRouteTwo2: true,
              showSubRoute: false,
              base: 'calls',
              icon: 'document',
              subMenus: [
                {
                  menuValue: 'Voice Call',
                  route: routes.voiceCall,
                  base: 'voice-call',
                },
                {
                  menuValue: 'video Call',
                  route: routes.videoCall,
                  base: 'video-call',
                },
                {
                  menuValue: 'Outgoing Call',
                  route: routes.outgoingCall,
                  base: 'outgoing-call',
                },
                {
                  menuValue: 'Incoming Call',
                  route: routes.incomingCall,
                  base: 'incoming-call',
                },
                {
                  menuValue: 'Call History',
                  route: routes.callHistory,
                  base: 'call-history',
                },
              ],
            },
            {
              separateRoute: true,
              menuValue: 'Calendar',
              tittle: 'Calendar',
              route: routes.calender,
              base: 'calendar',
              icon: 'calendar',
              showAsTab: false,
            },
            {
              separateRoute: true,
              menuValue: 'Contacts',
              route: routes.contacts,
              base: 'contacts',
              showAsTab: false,
            },
            {
              separateRoute: true,
              menuValue: 'Email',
              route: routes.email,
              base: 'email',
              showAsTab: false,
            },
            {
              hasSubRouteTwo2: true,
              showSubRoute: false,
              menuValue: 'Invoices',
              route: routes.email,
              base: 'invoice',
              showAsTab: false,
              subMenus: [
                {
                  menuValue: 'Invoices',
                  route: routes.invoice,
                  base: 'invoice',
                },
                {
                  menuValue: 'Invoice Details',
                  route: routes.invoiceDetails,
                  base: 'invoice-details',
                },
              ],
            },
            {
              separateRoute: true,
              menuValue: 'To Do',
              route: routes.todo,
              base: 'todo',
              showAsTab: false,
            },

            {
              separateRoute: true,
              menuValue: 'Notes',
              route: routes.notes,
              base: 'notes',
              showAsTab: false,
            },
            {
              separateRoute: true,
              menuValue: 'Kanban Board',
              route: routes.kanbanView,
              base: 'kanban-view',
              showAsTab: false,
            },
            {
              separateRoute: true,
              menuValue: 'File Manager',
              route: routes.fileManager,
              base: 'file-manager',
              showAsTab: false,
            },
            {
              separateRoute: true,
              menuValue: 'Social Feed',
              route: routes.socialFeed,
              base: 'social-feed',
              showAsTab: false,
            },

            {
              separateRoute: true,
              menuValue: 'Search List',
              route: routes.searchList,
              base: 'search-list',
              showAsTab: false,
            },
          ],
        },
        {
          menuValue: 'Layout',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'layout',
          icon: 'layout-sidebar',
          subMenus: [
            {
              menuValue: 'Default',
              route: routes.default,
              base: 'layout-default',
            },
            {
              menuValue: 'Mini',
              route: routes.mini,
              base: 'layout-mini',
            },
            {
              menuValue: 'Hover View',
              route: routes.hoverView,
              base: 'layout-hover-view',
            },
            {
              menuValue: 'Hidden',
              route: routes.hidden,
              base: 'layout-hidden',
            },
            {
              menuValue: 'Full Width',
              route: routes.fullWidth,
              base: 'layout-full-width',
            },
            {
              menuValue: 'RTL',
              route: routes.RTL,
              base: 'layout-rtl',
            },
            {
              menuValue: 'Dark',
              route: routes.dark,
              base: 'layout-dark',
            },
          ],
        },
      ],
    },
    {
      tittle: 'Clinic',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Doctors',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'doctor',
          icon: 'user-plus',
          subMenus: [
            {
              menuValue: 'Doctors',
              route: routes.doctorGrid,
              base: 'doctor-grid',
            },
            {
              menuValue: 'Doctor Details',
              route: routes.doctorDetails,
              base: 'doctor-details',
            },
            {
              menuValue: 'Add Doctor',
              route: routes.addDoctor,
              base: 'add-doctor',
            },
            {
              menuValue: 'Doctor Schedule',
              route: routes.doctorSchedule,
              base: 'doctor-schedule',
            },
          ],
        },
        {
          menuValue: 'Patients',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'patient',
          icon: 'user-heart',
          subMenus: [
            {
              menuValue: 'Patients',
              route: routes.patientGrid,
              base: 'patient-grid',
            },
            {
              menuValue: 'Patient Details',
              route: routes.patientDetails,
              base: 'patient-details',
            },
            {
              menuValue: 'Create Patient',
              route: routes.createPatient,
              base: 'create-patient',
            },
          ],
        },
        {
          menuValue: 'Appointments',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'appointment',
          icon: 'calendar-check',
          subMenus: [
            {
              menuValue: 'Appointments',
              route: routes.appointmentList,
              base: 'appointment-list',
            },
            {
              menuValue: 'New Appointment',
              route: routes.newAppointment,
              base: 'new-appointment',
            },
          ],
        },
        {
          menuValue: 'Locations',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.locations,
          base: 'locations',
          icon: 'map-pin',
          subMenus: [],
        },
        {
          menuValue: 'Services',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.services,
          base: 'services',
          icon: 'user-cog',
          subMenus: [],
        },
        {
          menuValue: 'Specializations',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.specializations,
          base: 'specializations',
          icon: 'user-cog',
          subMenus: [],
        },
        {
          menuValue: 'assets',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.assets,
          base: 'assets',
          icon: 'asset',
          subMenus: [],
        },
        {
          menuValue: 'activities',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.activities,
          base: 'activities',
          icon: 'activity',
          subMenus: [],
        },
        {
          menuValue: 'messages',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.messages,
          base: 'messages',
          icon: 'messages',
          subMenus: [],
        },
      ],
    },
    {
      tittle: 'HRM',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Staffs',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.staffs,
          base: 'staffs',
          icon: 'users-group',
          subMenus: [],
        },
        {
          menuValue: 'Departments',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.departments,
          base: 'departments',
          icon: 'building-bank',
          subMenus: [],
        },
        {
          menuValue: 'Designation',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.designation,
          base: 'designation',
          icon: 'user-cog',
          subMenus: [],
        },
        {
          menuValue: 'Attendance',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.attendance,
          base: 'attendance',
          icon: 'user-check',
          subMenus: [],
        },
        {
          menuValue: 'Leaves',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'leaves',
          icon: 'users-minus',
          subMenus: [
            {
              menuValue: 'Leaves',
              route: routes.leavesList,
              base: 'leaves-list',
            },
            {
              menuValue: 'Leave Type',
              route: routes.leaveType,
              base: 'leave-type',
            },
          ],
        },
        {
          menuValue: 'Holidays',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.holidays,
          base: 'holidays',
          icon: 'home-exclamation',
          subMenus: [],
        },
        {
          menuValue: 'Payroll',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.payroll,
          base: 'payroll',
          icon: 'coin',
          subMenus: [],
        },
      ],
    },
    {
      tittle: 'Finance & Accounts',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Expenses',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'expenses',
          icon: 'credit-card',
          subMenus: [
            {
              menuValue: 'Expenses',
              route: routes.expenseList,
              base: 'expense-list',
            },
            {
              menuValue: 'Expense Category',
              route: routes.expenseCategory,
              base: 'expense-category',
            },
          ],
        },
        {
          menuValue: 'Income',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.income,
          base: 'income',
          icon: 'coins',
          subMenus: [],
        },
        {
          menuValue: 'Invoices',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'invoices',
          icon: 'file-invoice',
          subMenus: [
            {
              menuValue: 'Invoices',
              route: routes.invoicesList,
              base: 'invoices-list',
            },
            {
              menuValue: 'Invoice Details',
              route: routes.invoicesDetails,
              base: 'invoices-details',
            },
          ],
        },
        {
          menuValue: 'Payments',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.financePayments,
          base: 'payments',
          icon: 'cards',
          subMenus: [],
        },
        {
          menuValue: 'Transactions',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.financeTransactions,
          base: 'transactions',
          icon: 'transition-right',
          subMenus: [],
        },
      ],
    },
    {
      tittle: 'Administration',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Users',
          hasSubRoute: true,
          showSubRoute: false,
          route: '',
          base: 'components',
          icon: 'user',
          subMenus: [
            {
              menuValue: 'Roles & Permissions',
              route: routes.rolesAndPermissions,
              base: 'roles-and-permissions',
            },
            {
              menuValue: 'Delete Account Request',
              route: routes.deleteAccountRequest,
              base: 'delete-account-request',
            },
          ],
        },
        {
          menuValue: 'Reports',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'reports',
          icon: 'report',
          subMenus: [
            {
              menuValue: 'Income Report',
              route: routes.incomeReport,
              base: 'income-report',
            },
            {
              menuValue: 'Expense Report',
              route: routes.expenseReport,
              base: 'expense-report',
            },
            {
              menuValue: 'Profit & Loss',
              route: routes.profitAndLoss,
              base: 'profit-and-loss',
            },
            {
              menuValue: 'Appointment Report',
              route: routes.appointmentReport,
              base: 'appointment-report',
            },
            {
              menuValue: 'Patient Report',
              route: routes.patientReport,
              base: 'patient-report',
            },
          ],
        },
      ],
    },
    {
      tittle: 'Content',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Pages',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.pages,
          base: 'pages',
          icon: 'brand-pagekit',
          subMenus: [],
        },
        {
          menuValue: 'Blogs',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'blogs',
          icon: 'brand-blogger',
          subMenus: [
            {
              menuValue: 'Add Blog',
              route: routes.addBlog,
              base: 'add-blog',
            },
            {
              menuValue: 'Blogs',
              route: routes.blogList,
              base: 'blog-list',
            },
            {
              menuValue: 'Blog Categories',
              route: routes.blogCategory,
              base: 'blog-category',
            },
            {
              menuValue: 'Blog Comments',
              route: routes.blogComments,
              base: 'blog-comments',
            },
          ],
        },
        {
          menuValue: 'Location',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'locations',
          icon: 'map-pins',
          subMenus: [
            {
              menuValue: 'Countries',
              route: routes.countries,
              base: 'countries',
            },
            {
              menuValue: 'States',
              route: routes.states,
              base: 'states',
            },
            {
              menuValue: 'Cities',
              route: routes.cities,
              base: 'cities',
            },
          ],
        },
        {
          menuValue: 'Testimonials',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.testimonials,
          base: 'testimonials',
          icon: 'cards',
          subMenus: [],
        },
        {
          menuValue: 'FAQ',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.faq,
          base: 'faq',
          icon: 'question-mark',
          subMenus: [],
        },
      ],
    },
    {
      tittle: 'Support',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Contact Messages',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.contactMessages,
          base: 'contact-messages',
          icon: 'message-dots',
          subMenus: [],
        },
        {
          menuValue: 'Tickets',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.tickets,
          base: 'tickets',
          icon: 'cards',
          subMenus: [],
        },
        {
          menuValue: 'Announcements',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.announcements,
          base: 'announcements',
          icon: 'speakerphone',
          subMenus: [],
        },
        {
          menuValue: 'Newsletters',
          hasSubRoute: false,
          showSubRoute: false,
         route: routes.newsLetters,
          base: 'newsletters',
          icon: 'mail-bolt',
          subMenus: [],
        },
      ],
    },
    {
      tittle: 'Pages',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Starter',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.starter,
          base: 'starter',
          icon: 'player-play',
          subMenus: [],
        },
        {
          menuValue: 'Profile',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.profile,
          base: 'profile',
          icon: 'cards',
          subMenus: [],
        },
        {
          menuValue: 'Gallery',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.gallery,
          base: 'gallery',
          icon: 'photo',
          subMenus: [],
        },
        {
          menuValue: 'Timeline',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.timeline,
          base: 'timeline',
          icon: 'timeline-event-text',
          subMenus: [],
        },
        {
          menuValue: 'Pricing',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.pricing,
          base: 'pricing',
          icon: 'tag',
          subMenus: [],
        },
        {
          menuValue: 'Coming Soon',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.comingSoon,
          base: 'coming-soon',
          icon: 'sparkles',
          subMenus: [],
        },
        {
          menuValue: 'Under Maintenance',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.underMaintenance,
          base: 'under-maintenance',
          icon: 'settings-down',
          subMenus: [],
        },
        {
          menuValue: 'Privacy Policy',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.privacyPolicy,
          base: 'privacy-policy',
          icon: 'shield-check',
          subMenus: [],
        },
        {
          menuValue: 'Terms & Conditions',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.termsConditions,
          base: 'terms-and-conditions',
          icon: 'file-time',
          subMenus: [],
        },
      ],
    },
    {
      tittle: 'Authentication',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Login',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'components',
          icon: 'login',
          subMenus: [
            {
              menuValue: 'Cover',
              route: routes.loginCover,
              base: 'login-cover',
            },
            {
              menuValue: 'Illustration',
              route: routes.loginIllustration,
              base: 'login-illustration',
            },
            {
              menuValue: 'Basic',
              route: routes.loginBasic,
              base: 'login-basic',
            },
          ],
        },
        {
          menuValue: 'Register',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'components',
          icon: 'file-pencil',
          subMenus: [
            {
              menuValue: 'Cover',
              route: routes.registerCover,
              base: 'register-cover',
            },
            {
              menuValue: 'Illustration',
              route: routes.registerIllustration,
              base: 'register-illustration',
            },
            {
              menuValue: 'Basic',
              route: routes.registerBasic,
              base: 'register-basic',
            },
          ],
        },
        {
          menuValue: 'Forgot Password',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'components',
          icon: 'lock-exclamation',
          subMenus: [
            {
              menuValue: 'Cover',
              route: routes.forgotPasswordCover,
              base: 'forgot-password-cover',
            },
            {
              menuValue: 'Illustration',
              route: routes.forgotPasswordIllustration,
              base: 'forgot-password-illustration',
            },
            {
              menuValue: 'Basic',
              route: routes.forgotPasswordBasic,
              base: 'forgot-password-basic',
            },
          ],
        },
        {
          menuValue: 'Reset Password',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'components',
          icon: 'restore',
          subMenus: [
            {
              menuValue: 'Cover',
              route: routes.resetPasswordCover,
              base: 'reset-password-cover',
            },
            {
              menuValue: 'Illustration',
              route: routes.resetPasswordIllustration,
              base: 'reset-password-illustration',
            },
            {
              menuValue: 'Basic',
              route: routes.resetPasswordBasic,
              base: 'reset-password-basic',
            },
          ],
        },
        {
          menuValue: 'Email Verification',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'components',
          icon: 'mail-check',
          subMenus: [
            {
              menuValue: 'Cover',
              route: routes.emailVerificationCover,
              base: 'email-verification-cover',
            },
            {
              menuValue: 'Illustration',
              route: routes.emailVerificationIllustration,
              base: 'email-verification-illustration',
            },
            {
              menuValue: 'Basic',
              route: routes.emailVerificationBasic,
              base: 'email-verification-basic',
            },
          ],
        },
        {
          menuValue: '2 Step Verification',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'components',
          icon: 'discount-check',
          subMenus: [
            {
              menuValue: 'Cover',
              route: routes.twoStepVerificationCover,
              base: 'two-step-verification-cover',
            },
            {
              menuValue: 'Illustration',
              route: routes.twoStepVerificationIllustration,
              base: 'two-step-verification-illustration',
            },
            {
              menuValue: 'Basic',
              route: routes.twoStepVerificationBasic,
              base: 'two-step-verification-basic',
            },
          ],
        },
        {
          menuValue: 'Lock Screen',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.lockScreen,
          base: 'lock-screen',
          icon: 'lock',
          subMenus: [],
        },
        {
          menuValue: 'Error Pages',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'components',
          icon: 'exclamation-mark-off',
          subMenus: [
            {
              menuValue: '404 Error',
              route: routes.error404,
              base: 'error404',
            },
            {
              menuValue: '500 Error',
              route: routes.error500,
              base: 'error500',
            },
          ],
        },
      ],
    },
    {
      tittle: 'Settings',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Account Settings',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'account-settings',
          icon: 'user-cog',
          subMenus: [
            {
              menuValue: 'Profile',
              route: routes.profileSettings,
              base: 'profile-settings',
            },
            {
              menuValue: 'Security',
              route: routes.securitySettings,
              base: 'security-settings',
            },
            {
              menuValue: 'Notifications',
              route: routes.notificationSettings,
              base: 'notifications-settings',
            },
            {
              menuValue: 'Integrations',
              route: routes.integrationSettings,
              base: 'integrations-settings',
            },
          ],
        },
        {
          menuValue: 'Website Settings',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'website-settings',
          icon: 'world-cog',
          subMenus: [
            {
              menuValue: 'Organization',
              route: routes.organizationSettings,
              base: 'organization-settings',
            },
            {
              menuValue: 'Localization',
              route: routes.localizationSettings,
              base: 'localization-settings',
            },
            {
              menuValue: 'Prefixes',
              route: routes.prefixesSettings,
              base: 'prefixes-settings',
            },
            {
              menuValue: 'SEO Setup',
              route: routes.seoSetupSettings,
              base: 'seo-setup-settings',
            },
            {
              menuValue: 'Language',
              route: routes.languageSettings,
              base: 'language-settings',
            },
            {
              menuValue: 'Maintenance Mode',
              route: routes.maintenanceModeSettings,
              base: 'maintenance-mode-settings',
            },
            {
              menuValue: 'Login & Register',
              route: routes.loginAndRegisterSettings,
              base: 'login-and-register-settings',
            },
            {
              menuValue: 'Preferences',
              route: routes.preferencesSettings,
              base: 'preferences-settings',
            },
          ],
        },
        {
          menuValue: 'Clinic Settings',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'clinic-settings',
          icon: 'building-hospital',
          subMenus: [
            {
              menuValue: 'Appointment',
              route: routes.appointmentSettings,
              base: 'appointment-settings',
            },
            {
              menuValue: 'Working Hours',
              route: routes.workingHoursSettings,
              base: 'working-hours-settings',
            },
            {
              menuValue: 'Cancellation Reason',
              route: routes.cancellationReasonSettings,
              base: 'cancellation-reason-settings',
            },
          ],
        },
        {
          menuValue: 'App Settings',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'app-settings',
          icon: 'device-mobile-cog',
          subMenus: [
            {
              menuValue: 'Invoice Settings',
              route: routes.invoiceSettings,
              base: 'invoice-settings',
            },
            {
              menuValue: 'Invoice Templates',
              route: routes.invoiceTemplatesSettings,
              base: 'invoice-templates-settings',
            },
            {
              menuValue: 'Signatures',
              route: routes.signaturesSettings,
              base: 'signatures-settings',
            },
            {
              menuValue: 'Custom Fields',
              route: routes.customFieldsSettings,
              base: 'custom-fields-settings',
            },
          ],
        },
        {
          menuValue: 'System Settings',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'system-settings',
          icon: 'device-desktop-cog',
          subMenus: [
            {
              menuValue: 'Email Settings',
              route: routes.emailSettings,
              base: 'email-settings',
            },
            {
              menuValue: 'Email Templates',
              route: routes.emailTemplatesSettings,
              base: 'email-templates-settings',
            },
            {
              menuValue: 'SMS Gateways',
              route: routes.smsGatewaysSettings,
              base: 'sms-gateways-settings',
            },
            {
              menuValue: 'SMS Templates',
              route: routes.smsTemplatesSettings,
              base: 'sms-templates-settings',
            },
            {
              menuValue: 'GDPR Cookies',
              route: routes.gdprCookiesSettings,
              base: 'gdpr-cookies-settings',
            },
          ],
        },
        {
          menuValue: 'Finance & Accounts',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'finance-settings',
          icon: 'settings-dollar',
          subMenus: [
            {
              menuValue: 'Payment Methods',
              route: routes.profileSettings,
              base: 'profile-settings',
            },
            {
              menuValue: 'Bank Accounts',
              route: routes.bankAccountsSettings,
              base: 'bank-accounts-settings',
            },
            {
              menuValue: 'Tax Rates',
              route: routes.taxRatesSettings,
              base: 'tax-rates-settings',
            },
            {
              menuValue: 'Currencies',
              route: routes.currenciesSettings,
              base: 'currencies-settings',
            },
          ],
        },
        {
          menuValue: 'Other Settings',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'other-settings',
          icon: 'settings-2',
          subMenus: [
            {
              menuValue: 'Sitemap',
              route: routes.sitemapSettings,
              base: 'sitemap-settings',
            },
            {
              menuValue: 'Clear Cache',
              route: routes.clearCacheSettings,
              base: 'clear-cache-settings',
            },
            {
              menuValue: 'Storage',
              route: routes.storageSettings,
              base: 'storage-settings',
            },
            {
              menuValue: 'Cronjob',
              route: routes.cronjobSettings,
              base: 'cronjob-settings',
            },
            {
              menuValue: 'Ban IP Address',
              route: routes.banIpAddressSettings,
              base: 'ban-ip-address-settings',
            },
            {
              menuValue: 'System Backup',
              route: routes.systemBackupSettings,
              base: 'system-backup-settings',
            },
            {
              menuValue: 'Database Backup',
              route: routes.databaseBackupSettings,
              base: 'database-settings',
            },
            {
              menuValue: 'System Update',
              route: routes.systemUpdateSettings,
              base: 'system-update',
            },
          ],
        },
      ],
    },
    {
      tittle: 'UI Interface',
      icon: 'layers',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Base UI',
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'chart-pie',
          base: 'base-ui',
          subMenus: [
            {
              menuValue: 'Accordions',
              route: routes.accordions,
              base: 'accordions',
            },
            {
              menuValue: 'Alerts',
              route: routes.alert,
              base: 'alert',
            },

            { 
              menuValue: 'Avatar', 
              route: routes.avatar, 
              base: 'avatar' 
            },
            { 
              menuValue: 'Badges', 
              route: routes.badges, 
              base: 'badges' 
            },
            {
              menuValue: 'Breadcrumb',
              route: routes.breadcrumb,
              base: 'breadcrumb',
            },
            {
              menuValue: 'Buttons',
              route: routes.buttons,
              base: 'buttons'
            },
            {
              menuValue: 'Button Group',
              route: routes.buttonGroup,
              base: 'button-group'
            },

            { 
              menuValue: 'Cards', 
              route: routes.cards, 
              base: 'cards'
            },
            {
              menuValue: 'Carousel',
              route: routes.carousel,
              base: 'carousel'
            },
            {
              menuValue: 'Collapse',
              route: routes.collapse,
              base: 'collapse'
            },
            {
              menuValue: 'Dropdowns',
              route: routes.dropDown,
              base: 'drop-down'
            },
            {
              menuValue: 'Ratio',
              route: routes.ratio,
              base: 'ratio'
            },
            { 
              menuValue: 'Grid', 
              route: routes.grid, 
              base: 'grid'
            },
            { 
              menuValue: 'Images', 
              route: routes.images, 
              base: 'images'
            },
            {
              menuValue: 'Links',
              route: routes.links,
              base: 'links'
            },
            {
              menuValue: 'List Group',
              route: routes.listGroup,
              base: 'list-group'
            },
            { 
              menuValue: 'Modals', 
              route: routes.modal, 
              base: 'modal'
            },
            {
              menuValue: 'Offcanvas',
              route: routes.offcanvas,
              base: 'offcanvas'
            },
            {
              menuValue: 'Pagination',
              route: routes.pagination,
              base: 'pagination'
            },

            {
              menuValue: 'Placeholders',
              route: routes.placeholder,
              base: 'placeholders'
            },
            {
              menuValue: 'Progress',
              route: routes.progressBars,
              base: 'progress-bars'
            },
            {
              menuValue: 'Spinner',
              route: routes.spinner,
              base: 'spinner'
            },
            { 
              menuValue: 'Tabs', 
              route: routes.tabs,
              base: 'tabs'
            },
            { 
              menuValue: 'Toasts',
              route: routes.toasts, 
              base: 'toasts'
            },
            {
              menuValue: 'Tooltip',
              route: routes.tooltip,
              base: 'tooltip'
            },
            {
              menuValue: 'Typography',
              route: routes.typography,
              base: 'typography'
            },
            {
              menuValue: 'Utilities',
              route: routes.utilities,
              base: 'utilities'
            },
          ],
        },
        {
          menuValue: 'Advanced UI',
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'radar',
          base: 'advanced-ui',
          subMenus: [
            {
              menuValue: 'Drag & Drop',
              route: routes.dragDrop,
              base: 'drag-drop'
            },
            {
              menuValue: 'Clipboard',
              route: routes.clipboards,
              base: 'clipboards'
            },
            {
              menuValue: 'Light Box',
              route: routes.lightBox,
              base: 'light-box'
            },
            {
              menuValue: 'Scrollbar',
              route: routes.scrollbar,
              base: 'scrollbar'
            },
          ],
        },
        {
          menuValue: 'Forms',
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'forms',
          base: 'forms',
          subMenus: [
            {
              menuValue: 'Form Elements',
              hasSubRouteTwo2: true,
              showSubRoute: false,
              icon: 'password-check5',
              base: 'forms',
              subMenus: [
                {
                  menuValue: 'Basic Inputs',
                  route: routes.basicForm,
                  base: 'basic-inputs',
                },
                {
                  menuValue: 'Checkbox & Radios',
                  route: routes.checkboxRadios,
                  base: 'form-checkbox-radios',
                },
                {
                  menuValue: 'Input Groups',
                  route: routes.inputGroups,
                  base: 'input-groups',
                },
                {
                  menuValue: 'Grid & Gutters',
                  route: routes.gridGutters,
                  base: 'form-grid-gutters',
                },
                {
                  menuValue: 'Input Masks',
                  route: routes.formMask,
                  base: 'form-mask',
                },
                {
                  menuValue: 'File Uploads',
                  route: routes.fileUpload,
                  base: 'file-upload',
                },
              ],
            },
            {
              menuValue: 'Layouts',
              hasSubRouteTwo2: true,
              showSubRoute: false,
              base: 'forms',
              subMenus: [
                {
                  menuValue: 'Horizontal Form',
                  route: routes.horizontalForm,
                  base: 'horizontal-form'
                },
                {
                  menuValue: 'Vertical Form',
                  route: routes.verticalForm,
                  base: 'vertical-form'
                },
              ],
            },
            {
              menuValue: 'Form Validation',
              route: routes.formValidation,
              base: 'form-validation'
            },
            {
              menuValue: 'Form Picker',
              route: routes.formpickers,
              base: 'form-pickers'
            },
          ],
        },

        {
          menuValue: 'Tables',
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'table-row',
          base: 'tables',
          subMenus: [
            {
              menuValue: 'Basic Tables',
              route: routes.basicTable,
              base: 'basic',
            },
            {
              menuValue: 'Data Tables',
              route: routes.dataTable,
              base: 'data-table'
            },
          ],
        },
        {
          menuValue: 'Charts',
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'chart-donut',
          base: 'chart',
          subMenus: [
            {
              menuValue: 'Apex Charts',
              route: routes.apexChart,
              base: 'apex-charts',
            },
            {
              menuValue: 'Prime Ng Charts',
              route: routes.primeng,
              base: 'prime-ng'
            },
          ],
        },
        {
          menuValue: 'Icons',
          hasSubRoute: true,
          showSubRoute: false,
          icon: 'icons',
          base: 'icon',
          subMenus: [
            {
              menuValue: 'Fontawesome Icons',
              route: routes.fontawesome,
              base: 'fontawesome'
            },
            {
              menuValue: 'Feather Icons',
              route: routes.feather,
              base: 'feather'
            },
            {
              menuValue: 'Ionic Icons',
              route: routes.ionic,
              base: 'ionic'
            },
            {
              menuValue: 'Material Icons',
              route: routes.material,
              base: 'material'
            },
            { menuValue: 'pe7 Icons', 
              route: routes.pe7, 
              base: 'pe7'
            },
            {
              menuValue: 'Simpleline Icons',
              route: routes.simpleLine,
              base: 'simpleline'
            },
            {
              menuValue: 'Themify Icons',
              route: routes.themify,
              base: 'themify'
            },
            {
              menuValue: 'Weather Icons',
              route: routes.weather,
              base: 'weather'
            },
            {
              menuValue: 'Typicon Icons',
              route: routes.typicon,
              base: 'typicon'
            },
            { menuValue: 'Flag Icons', route: routes.flag, base: 'flag'}
          ],
        },
      ],
    },
  ];
  public sideBar2: any[] = [
    {
      tittle: 'Main Menu',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Dashboard',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'dashboard',
          route: routes.doctorDashboard,
          icon: 'layout-dashboard',
          subMenus: [],
        },
        {
          menuValue: 'Appointments',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'appointments',
          icon: 'calendar-check',
          subMenus: [
            {
              separateRoute: true,
              menuValue: 'Appointments',
              route: routes.doctorAppointments,
              base: 'appointments',
              showAsTab: false,
            },
            {
              separateRoute: true,
              menuValue: 'Onlne Consultations',
              route: routes.onlineConsultations,
              base: 'online-consultations',
              showAsTab: false,
            },
          ],
        },
        {
          menuValue: 'My Schedule',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'schedules',
          route: routes.doctorSchedules,
          icon: 'clock-check',
          subMenus: [],
        },
        {
          menuValue: 'Prescriptions',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'prescriptions',
          route: routes.doctorPrescriptions,
          icon: 'prescription',
          subMenus: [],
        },
        {
          menuValue: 'Leave',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'leaves',
          route: routes.doctorLeave,
          icon: 'calendar-x',
          subMenus: [],
        },
        {
          menuValue: 'Reviews',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'reviews',
          route: routes.doctorReviews,
          icon: 'star',
          subMenus: [],
        },
        {
          menuValue: 'Settings',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'profile-settings',
          icon: 'settings',
          subMenus: [
            {
              separateRoute: true,
              menuValue: 'Profile Settings',
              route: routes.doctorProfileSettings,
              base: 'profile-settings',
              showAsTab: false,
            },
            {
              separateRoute: true,
              menuValue: 'Password Settings',
              route: routes.doctorPasswordSettings,
              base: 'password-settings',
              showAsTab: false,
            },
            {
              separateRoute: true,
              menuValue: 'Notification Settings',
              route: routes.doctorNotificationSettings,
              base: 'notification-settings',
              showAsTab: false,
            },
          ],
        },
      ],
    },
  ];
  public sideBar3: any[] = [
    {
      tittle: 'Main Menu',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Dashboard',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'dashboard',
          route: routes.patientDashboard,
          icon: 'layout-dashboard',
          subMenus: [],
        },
        {
          menuValue: 'Appointments',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'appointments',
          route: routes.patientAppointments,
          icon: 'layout-dashboard',
          subMenus: [],
        },
        {
          menuValue: 'Doctor',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'doctor',
          route: routes.patientDoctors,
          icon: 'stethoscope',
          subMenus: [],
        },
        {
          menuValue: 'Prescriptions',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'prescriptions',
          route: routes.patientPrescriptions,
          icon: 'prescription',
          subMenus: [],
        },
        {
          menuValue: 'Invoice',
          hasSubRoute: false,
          showSubRoute: false,
          base: 'invoices',
          route: routes.patientInvoices,
          icon: 'star',
          subMenus: [],
        },
        {
          menuValue: 'Settings',
          hasSubRoute: true,
          showSubRoute: false,
          base: 'application',
          icon: 'settings',
          subMenus: [
            {
              separateRoute: true,
              menuValue: 'Profile Settings',
              route: routes.patientProfileSettings,
              base: routes.chat,
              showAsTab: false,
            },
            {
              separateRoute: true,
              menuValue: 'Password Settings',
              route: routes.patientPasswordSettings,
              base: routes.chat,
              showAsTab: false,
            },
            {
              separateRoute: true,
              menuValue: 'Notification Settings',
              route: routes.patientNotificationSettings,
              base: '',
              showAsTab: false,
            },
          ],
        },
      ],
    },
  ];
  public getSideBarData: BehaviorSubject<Array<SideBarData>> =
    new BehaviorSubject<Array<SideBarData>>(this.sideBar);
  public getSideBar2Data: BehaviorSubject<Array<SideBarData>> =
    new BehaviorSubject<Array<SideBarData>>(this.sideBar2);
  public getSideBar3Data: BehaviorSubject<Array<SideBarData>> =
    new BehaviorSubject<Array<SideBarData>>(this.sideBar3);
  public resetData(): void {
    this.sideBar.map((res: SideBarData) => {
      res.showAsTab = false;
      res.menu.map((menus: MenuItem) => {
        menus.showSubRoute = false;
      });
    });
  }

}
