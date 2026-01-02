# Product Requirement Document (PRD)

## LGU Energy Efficiency and Conservation (EEC) Platform (Serverless Version)

### 1. Introduction

The LGU EEC Platform is a web-based application designed to assist Local Government Units (LGUs) in the Philippines in managing, monitoring, and reporting their energy efficiency and conservation efforts. This project will be a serverless Client-Side Web App (HTML/JS/CSS) hosted on **GitHub Pages**, and backed by **Google Firebase Firestore** for its database needs.

### 2. Goals

* **Serverless Architecture**: Eliminate the need for managing a backend server by using GitHub Pages for hosting and Firebase for backend services.
* **Real-time Data**: Utilize Firestore for real-time data syncing.
* **Scalability**: Leverage Firebase's auto-scaling infrastructure.
* **Compliance**: Maintain adherence to the LEEC Act (AO 15) data requirements.

### 3. Functional Requirements

* **Asset Management**: Inventory tracking for Buildings (FSBD), Vehicles, and Equipment (MADE).
* **Consumption Tracking**: Monthly logging of Electricity (kWh) and Fuel (Liters).
* **Analysis**: Automatic/Manual identification of Significant Energy Use (SEU).
* **Action Planning**: Creation of Recommendations for Improvement (RIO) and tracking of Programs and Projects (PPA).
* **Future Implementation**: Document uploads for verification (e.g., electricity bills, fuel receipts, agency logos) will be added in a future version.

### 4. Data Model (Detailed Firestore Schema)

#### 4.1 `lgus` (LGU Profiles)

* `name`: (String) Full name of the LGU.
* `income_class`: (String) e.g., '1st Class', 'Special Cities'.
* `head_of_lgu`: (String) Name of Mayor/Governor.
* `position`: (String) Title of the head.
* `address`: (String) Full office address.
* `region`: (String) Philippine region.
* `province`: (String) Province name.
* `city_municipality`: (String) Local area name.
* `office_contact_number`: (String) Optional phone.
* `email`: (String) Official email.
* `date_registered`: (Timestamp)

#### 4.2 `fsbds` (Facilities Management)

* `name`: (String) FSBD Name.
* `fsbd_type`: (String) e.g., 'Office Building', 'Hospital', 'Streetlight Section'.
* `description`: (String)
* `address`: (String)
* `construction_year`: (Number)
* `building_material`: (String)
* `floor_area_sqm`: (Number)
* `airconditioned_area_sqm`: (Number)
* `number_of_floors`: (Number)
* `occupancy_type`: (String) e.g., 'Educational', 'Industrial'.
* `number_of_occupants`: (Number)
* `operational_hours_weekday`: (String), `operational_hours_weekend`: (String)
* `primary_energy_source`: (String) e.g., 'Grid Electricity'.
* `meter_id`: (String) Main electricity meter reference.

#### 4.3 `vehicles` (Fleet Inventory)

* `plate_number`: (String) Unique identifier.
* `make`: (String), `model`: (String), `year_model`: (Number)
* `fuel_type`: (String) 'Gasoline' or 'Diesel'.
* `operational_condition`: (String) 'Operational', 'Under Repair', etc.
* `ownership`: (String) 'Owned' or 'Leased'.
* `engine_displacement`: (String), `transmission`: (String)

#### 4.4 `made_equipment` (Asset-level Equipment)

* `fsbdId`: (String) Reference to `fsbds`.
* `energy_use_category`: (String) e.g., 'ACU', 'Lighting'.
* `description_of_equipment`: (String) Specs.
* `id_number`: (String) Serial number.
* `location`: (String) Specific room/area.
* `power_rating_kw`: (Number)
* `time_of_use_hours_per_day`: (Number)
* `energy_consumption_kwh_per_month`: (Number) Calculated.
* `percent_weight`: (Number) % of total FSBD consumption.

#### 4.5 `mecr_reports` (Electricity Consumption)

* `fsbdId`: (String)
* `reporting_year`: (Number), `reporting_month`: (Number)
* `electricity_consumption_kwh`: (Number)
* `cost_php`: (Number)

#### 4.6 `mfcr_reports` (Fuel Consumption)

* `vehicleId`: (String)
* `reporting_year`: (Number), `reporting_month`: (Number)
* `fuel_consumed_liters`: (Number), `cost_php`: (Number)
* `distance_traveled_km`: (Number)
* `odometer_start`: (Number), `odometer_end`: (Number)

#### 4.7 `seu_findings` (Significant Energy Use)

* `fsbdId`: (String)
* `energy_use_category`: (String)
* `linkedEquipmentIds`: (Array of Strings) References to `made_equipment`.
* `finding_description`: (String)
* `identification_method`: (String)
* `status`: (String) 'System Suggested', 'Auditor Confirmed'.

#### 4.8 `rios` (Recommendations)

* `fsbdId`: (String), `vehicleId`: (String)
* `seuFindingIds`: (Array of Strings) References to `seu_findings`.
* `proposed_action`: (String)
* `priority`: (String) 'High', 'Medium', 'Low'.
* `estimated_cost_php`: (Number), `estimated_savings_php`: (Number)
* `status`: (String) 'Identified', 'Planned', 'In Progress', 'Completed'.

#### 4.9 `ppas` (Programs & Projects)

* `project_name`: (String)
* `relatedRioIds`: (Array of Strings) References to `rios`.
* `estimated_cost_php`: (Number), `actual_cost_php`: (Number)
* `status`: (String) 'Planned', 'Ongoing', 'Completed'.

### 5. Non-Functional Requirements

* **Security Rules**: For initial development, Firestore rules will be open, allowing read/write access without authentication. This is not secure and must be addressed before any production deployment.
* **Offline Support**: Enable Firestore persistence for data entry in areas with poor connectivity.
* **Performance**: Use indexes for common queries to ensure fast data retrieval.