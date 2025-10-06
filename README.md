# 🧔 Barber Shop Booking App

## 1. Introduction

👉 [GitHub Repo](https://github.com/Mirazil/barber-shop)

👉 [Vercel Deploy Link](https://barber-shop-dliag3r6n-mirazils-projects.vercel.app/)

The main idea of this project is to create a simple **web service for a barber shop** that allows clients to:

- view information about the barbershop (landing page);
- **book an appointment with a barber online**;
- automatically **synchronize bookings with the administrator’s Google Calendar**.

The project follows the same structure as the tutorial **Tutor.docx**, from domain models and use cases to deployment.

---

## 2. Tech Stack

**Frontend:** React, TailwindCSS, Vite  
**Backend:** Google Apps Script (for Google Calendar integration)  
**Database:** Google Calendar (as booking storage)  
**Hosting:** Vercel (for frontend)

---

## 3. Domain Models

### Barber

- **Attributes:**
  - `id: UUID`
  - `name: string`
  - `specialization: string`
  - `photo_url: string`
- **Relationships:** has many **Appointments**

### Appointment

- **Attributes:**
  - `id: UUID`
  - `barber_id: UUID`
  - `client_name: string`
  - `client_phone: string`
  - `date: Date`
  - `time: Time`
  - `created_at: DateTime`
- **Relationships:** belongs to **Barber**

### Admin

- **Attributes:**
  - `id: UUID`
  - `email: string`
  - `google_calendar_id: string`
  - `google_calendar_token: string`

---

## 4. Use Cases

### 1. View Landing Page

- **Who:** Any visitor
- **Steps:**
  1. User opens the landing page
  2. Reads info about the barbershop, services, and barbers
  3. Presses “Book an appointment” button

### 2. Book an Appointment

- **Who:** Client
- **Steps:**
  1. Selects a barber
  2. Chooses available date and time
  3. Enters name and phone number
  4. Presses “Book”
  5. System sends booking to Google Calendar (using Apps Script)
  6. Success message displayed to user

### 3. Save Appointment to Google Calendar

- **Who:** System
- **Steps:**
  1. Receive data from frontend form
  2. Create an event in admin’s Google Calendar
  3. Store details: barber, client name, phone, date/time

### 4. View All Appointments

- **Who:** Administrator
- **Steps:**
  1. Opens Google Calendar
  2. Sees all booked appointments automatically added

### 5. Cancel Appointment

- **Who:** Administrator
- **Steps:**
  1. Deletes event in Google Calendar
  2. The system automatically removes it from visible appointments on the site

---

## 5. UI Mock Structure

The app consists of two pages:

### Landing Page

- Header with logo and navigation
- About section
- List of barbers (photos, names, specialization)
- “Book Appointment” button

### Booking Page

- Form fields:
  - Select barber
  - Select date/time
  - Name, phone number
  - Submit button
- Confirmation message

---

## 6. Backend Integration (Google Calendar)

All appointments are added via **Google Apps Script Web App** endpoint using JSONP (to bypass CORS).  
This allows frontend to directly send booking requests to the script, which:

- receives the booking data;
- creates an event in Google Calendar;
- returns confirmation to frontend.

---

## 7. Deployment

**Steps to deploy:**

1. Push project to GitHub.
2. Deploy frontend to **Vercel** (connect GitHub repo).
3. Deploy Apps Script backend as **Web App**.
4. Copy script URL and paste it in frontend `App.jsx`.

---

## 8. Domain Logic Summary

**Main Entities:** Barber, Appointment, Admin  
**Main Actions:** Booking, Viewing, Syncing with Google Calendar  
**Main Goal:** Provide a simple online booking system for a barber shop with instant calendar integration.

---

## 9. Author

**Developer:** Oleh Chudakov
**Course Project:** Enterprise Programming  
**Year:** 2025
