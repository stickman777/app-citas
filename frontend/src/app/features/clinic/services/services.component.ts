import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { PaginationService, tablePageSize } from '../../../shared/custom-pagination/pagination.service';
import { DataService } from '../../../shared/data/data.service';
import { apiResultFormat, service, pageSelection } from '../../../shared/models/models';
import { routes } from '../../../shared/routes/routes';
import { CustomPaginationComponent } from '../../../shared/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { MatSelectModule } from '@angular/material/select';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
interface variable {
    data: string,
}
@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  imports: [CommonModule,CustomPaginationComponent,MatSortModule,FormsModule,MultiSelectModule,MatSelectModule,BsDatepickerModule]
})
export class ServicesComponent {
        designation!: variable[];
        department!: variable[];
      status!: variable[];
      selectedDesignation!: variable[];
      selectedDepartment!: variable[];
      selectedStatus!: variable[];
routes=routes
public pageSize = 10;
public tableData: service[] = [];
public tableDataCopy: service[] = [];
public actualData: service[] = [];
public currentPage = 1;
public skip = 0;
public limit: number = this.pageSize;
public serialNumberArray: number[] = [];
public totalData = 0;
public pageSelection: pageSelection[] = [];
dataSource!: MatTableDataSource<service>;
public searchDataValue = '';
public row=true;
constructor(
  private data: DataService,
  private router: Router,
  private pagination: PaginationService
) {
      
  
          this.designation = [
              {data: 'General Consultation'},
              {data: 'Dental Cleaning'},
              {data: 'Eye Checkup'},
              {data: 'X-Ray'},
              {data: 'Physiotherapy Session'},
              {data: 'Cardiac Screening'},
              {data: 'Skin Allergy Test'},
              {data: 'Blood Test'},
              {data: 'ENT Consultation'},
              {data: 'Nutrition Counseling'},
          ];
          this.selectedDesignation = [this.designation[0]];

          this.department = [
              {data: 'General Medicine'},
              {data: 'Dentistry'},
              {data: 'Ophthalmology'},
              {data: 'Radiology'},
              {data: 'Physiotherapy'},
              {data: 'Cardiology'},
              {data: 'Dermatology'},
              {data: 'Pathology'},
              {data: 'ENT'},
              {data: 'Nutrition'},
          ];
          this.selectedDepartment = [this.department[0]];

          this.status = [
              {data: 'Active'},
              {data: 'Inactive'},
          ];
          this.selectedStatus=[this.status[0]]
  this.data.getServices().subscribe((apiRes: apiResultFormat) => {
    this.actualData = apiRes.data;
    this.pagination.tablePageSize.subscribe((res: tablePageSize) => {
      if (this.router.url == this.routes.services) {
        this.getTableData({ skip: res.skip, limit: res.limit });
        this.pageSize = res.pageSize;
      }
    });
  });
}
private getTableData(pageOption: pageSelection): void {
  this.data.getServices().subscribe((apiRes: apiResultFormat) => {
    this.tableData = [];
    this.tableDataCopy = [];
    this.serialNumberArray = [];
    this.totalData = apiRes.totalData;
    apiRes.data.map((res: service, index: number) => {
      const serialNumber = index + 1;
      if (index >= pageOption.skip && serialNumber <= pageOption.limit) {
        res.sNo = serialNumber;
        this.tableData.push(res);
        this.tableDataCopy.push(res);
        this.serialNumberArray.push(serialNumber);
      }
    });
    this.dataSource = new MatTableDataSource<service>(this.actualData);
    this.pagination.calculatePageSize.next({
      totalData: this.totalData,
      pageSize: this.pageSize,
      tableData: this.tableData,
      serialNumberArray: this.serialNumberArray,
    });
  });
}

public searchData(value: string): void {
  this.searchDataValue = value.trim().toLowerCase();
  this.dataSource.filter = this.searchDataValue;
  this.tableData = this.dataSource.filteredData;
  this.row = this.tableData.length > 0;

  if (this.searchDataValue !== '') {
    // Handle filtered data
    this.pagination.calculatePageSize.next({
      totalData: this.tableData.length,
      pageSize: this.pageSize,
      tableData: this.tableData,
      serialNumberArray: this.tableData.map((_, i) => i + 1), // Generates serials like [1, 2, 3...]
    });
  } else {
    // Handle reset to full data
    this.pagination.calculatePageSize.next({
      totalData: this.totalData,
      pageSize: this.pageSize,
      tableData: this.tableData,
      serialNumberArray: this.serialNumberArray,
    });
  }
}

public sortData(sort: Sort) {
  const data = this.tableData.slice();

  if (!sort.active || sort.direction === '') {
    this.tableData = data;
  } else {
    this.tableData = data.sort((a, b) => {
      const aValue = (a as never)[sort.active];

      const bValue = (b as never)[sort.active];
      return (aValue < bValue ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
    });
  }
}
public changePageSize(pageSize: number): void {
  this.pageSelection = [];
  this.limit = pageSize;
  this.skip = 0;
  this.currentPage = 1;
  this.pagination.tablePageSize.next({
    skip: this.skip,
    limit: this.limit,
    pageSize: this.pageSize,
  });
}
}
