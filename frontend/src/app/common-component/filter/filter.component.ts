import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
interface variable {
    data: string,
}

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, 
    MultiSelectModule,
    BsDatepickerModule
   ]
})
export class FilterComponent {
    doctor!: variable[];
    designation!: variable[];
    department!: variable[];
    amount!: variable[];
    status!: variable[];
    selectedDoctors!: variable[];
    selectedDesignation!: variable[];
    selectedDepartment!: variable[];
    selectedAmount!: variable[];
    selectedStatus!: variable[];
    constructor() {
        this.doctor = [
            {data: 'Dr. Mick Thompson'},
            {data: 'Dr. Sarah Johnson'},
            {data: 'Dr. Emily Carter'},
            {data: 'Dr. David Lee'},
            {data: 'Dr. Anna Kim'}
        ];
        this.selectedDoctors = [this.doctor[0]];

        this.designation = [
            {data: 'Cardiologist'},
            {data: 'Orthopedic Surgeon'},
            {data: 'Pediatrician'},
            {data: 'Gynecologist'}
        ];
        this.selectedDesignation = [this.designation[0]];

        this.department = [
            {data: 'Cardiologist'},
            {data: 'Orthopedics'},
            {data: 'Pediatrician'},
        ];
        this.selectedDepartment = [this.department[0]];
        
        this.amount = [
            {data: '$501 - $1000'},
            {data: '$501 - $1100'},
            {data: '$701 - $1200'},
        ];
        this.selectedAmount = [this.amount[0]];

        this.status = [
            {data: 'Available'},
            {data: 'Unavailable'},
        ];
        this.selectedStatus = [this.status[0]];
    }
}
