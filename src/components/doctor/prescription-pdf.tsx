'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { Prescription, Patient, StaffMember } from '@/types'

// ── Explicit hex colors (react-pdf cannot use CSS vars / oklch) ──

const C = {
  brand: '#F08A1D',
  deep: '#D9700C',
  ink: '#1F1410',
  soft: '#5C504A',
  faint: '#938880',
  line: '#EDE6E0',
  lineSoft: '#F4EEE9',
  canvas: '#FAF8F6',
  white: '#FFFFFF',
  danger: '#E5484D',
}

interface CenterInfo {
  name: string
  address: string
  phone: string
  email: string
}

export interface PrescriptionPdfProps {
  prescription: Prescription
  patient: Patient
  doctor: StaffMember
  center: CenterInfo
}

// ── Styles ──

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.ink,
    lineHeight: 1.5,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  centerName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.deep,
  },
  rxLabel: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.brand,
    marginTop: 2,
  },
  headerRight: {
    textAlign: 'right' as const,
    fontSize: 8,
    color: C.soft,
  },
  brandRule: {
    height: 2,
    backgroundColor: C.brand,
    marginBottom: 14,
  },
  // Doctor line
  doctorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  doctorName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  doctorSub: {
    fontSize: 9,
    color: C.soft,
  },
  dateText: {
    fontSize: 9,
    color: C.soft,
    textAlign: 'right' as const,
  },
  // Patient block
  patientBox: {
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  patientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  patientDetail: {
    fontSize: 9,
    color: C.soft,
  },
  // Section
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.faint,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 12,
  },
  sectionText: {
    fontSize: 10,
    color: C.ink,
    marginBottom: 2,
  },
  // Medicines table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.lineSoft,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.lineSoft,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  colNum: { width: '6%', fontSize: 8, color: C.faint },
  colName: { width: '22%', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  colDose: { width: '14%', fontSize: 9 },
  colFreq: { width: '20%', fontSize: 9 },
  colDur: { width: '14%', fontSize: 9 },
  colInst: { width: '24%', fontSize: 8, color: C.soft },
  thText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.faint,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  // Lists
  listItem: {
    fontSize: 9,
    color: C.ink,
    marginBottom: 1,
    paddingLeft: 8,
  },
  listItemDanger: {
    fontSize: 9,
    color: C.danger,
    marginBottom: 1,
    paddingLeft: 8,
  },
  // Footer
  footer: {
    position: 'absolute' as const,
    bottom: 40,
    left: 40,
    right: 40,
  },
  sigArea: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sigBlock: {
    alignItems: 'center' as const,
    width: 180,
  },
  sigLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: C.ink,
    marginBottom: 4,
  },
  sigName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  sigSub: {
    fontSize: 8,
    color: C.soft,
  },
  footerNote: {
    fontSize: 7,
    color: C.faint,
    textAlign: 'center' as const,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.lineSoft,
    paddingTop: 6,
  },
})

// ── Document ──

export function PrescriptionDocument({
  prescription: rx,
  patient,
  doctor,
  center,
}: PrescriptionPdfProps) {
  const age = (() => {
    const dob = new Date(patient.dob)
    const now = new Date()
    let a = now.getFullYear() - dob.getFullYear()
    const md = now.getMonth() - dob.getMonth()
    if (md < 0 || (md === 0 && now.getDate() < dob.getDate())) a--
    return a
  })()

  const dateStr = new Date(rx.date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.centerName}>{center.name}</Text>
            <Text style={s.rxLabel}>&#8478; Prescription</Text>
          </View>
          <View style={s.headerRight}>
            <Text>{center.address}</Text>
            <Text>{center.phone}</Text>
            <Text>{center.email}</Text>
          </View>
        </View>
        <View style={s.brandRule} />

        {/* Doctor line */}
        <View style={s.doctorRow}>
          <View>
            <Text style={s.doctorName}>{doctor.name}</Text>
            <Text style={s.doctorSub}>
              {doctor.specialty ?? 'General Medicine'}
              {doctor.qualifications ? ` | ${doctor.qualifications}` : ''}
            </Text>
          </View>
          <View>
            <Text style={s.dateText}>Date: {dateStr}</Text>
            <Text style={s.dateText}>Ref: {rx.id}</Text>
          </View>
        </View>

        {/* Patient block */}
        <View style={s.patientBox}>
          <Text style={s.patientName}>{patient.name}</Text>
          <Text style={s.patientDetail}>
            {age} yrs | {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)} | ID: {patient.id}
          </Text>
        </View>

        {/* Chief complaint */}
        {rx.chiefComplaint ? (
          <>
            <Text style={s.sectionLabel}>Chief Complaint</Text>
            <Text style={s.sectionText}>{rx.chiefComplaint}</Text>
          </>
        ) : null}

        {/* Diagnosis */}
        <Text style={s.sectionLabel}>Diagnosis</Text>
        <Text style={s.sectionText}>{rx.diagnosis}</Text>

        {/* Medicines */}
        {rx.medicines.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Medicines</Text>
            <View style={s.tableHeader}>
              <Text style={{ ...s.colNum, ...s.thText }}>#</Text>
              <Text style={{ ...s.colName, ...s.thText }}>Medicine</Text>
              <Text style={{ ...s.colDose, ...s.thText }}>Dose</Text>
              <Text style={{ ...s.colFreq, ...s.thText }}>Frequency</Text>
              <Text style={{ ...s.colDur, ...s.thText }}>Duration</Text>
              <Text style={{ ...s.colInst, ...s.thText }}>Instructions</Text>
            </View>
            {rx.medicines.map((m, i) => (
              <View key={i} style={s.tableRow}>
                <Text style={s.colNum}>{i + 1}</Text>
                <Text style={s.colName}>{m.name}</Text>
                <Text style={s.colDose}>{m.dose}</Text>
                <Text style={s.colFreq}>{m.frequency}</Text>
                <Text style={s.colDur}>{m.duration}</Text>
                <Text style={s.colInst}>{m.instructions ?? ''}</Text>
              </View>
            ))}
          </>
        )}

        {/* Tests */}
        {rx.testsSuggested.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Tests Suggested</Text>
            <Text style={s.sectionText}>{rx.testsSuggested.join(', ')}</Text>
          </>
        )}

        {/* To-dos */}
        {rx.todos.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Instructions for Patient</Text>
            {rx.todos.map((t, i) => (
              <Text key={i} style={s.listItem}>{'\u2022'} {t}</Text>
            ))}
          </>
        )}

        {/* Not to-dos */}
        {rx.notTodos.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Avoid</Text>
            {rx.notTodos.map((t, i) => (
              <Text key={i} style={s.listItemDanger}>{'\u2022'} {t}</Text>
            ))}
          </>
        )}

        {/* Follow-up */}
        {rx.followUpDate && (
          <>
            <Text style={s.sectionLabel}>Follow-up</Text>
            <Text style={s.sectionText}>
              {new Date(rx.followUpDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
            </Text>
          </>
        )}

        {/* Notes */}
        {rx.notes && (
          <>
            <Text style={s.sectionLabel}>Notes</Text>
            <Text style={s.sectionText}>{rx.notes}</Text>
          </>
        )}

        {/* Signature */}
        <View style={s.sigArea}>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{doctor.name}</Text>
            <Text style={s.sigSub}>{doctor.specialty ?? 'General Medicine'}</Text>
          </View>
        </View>

        {/* Footer note */}
        <View style={s.footer}>
          <Text style={s.footerNote}>
            Generated by ClinicOS | {center.name} | This is a computer-generated prescription.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
