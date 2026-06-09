'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  Crown,
  Pencil,
  Plus,
  X,
  UsersRound,
  Database,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, SectionCard, SlideOver } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { plans as initialPlans } from '@/lib/data'
import { formatCurrency } from '@/lib/utils'
import type { Plan } from '@/types'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)

  function handleSave(updated: Plan) {
    setPlans((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    )
    setEditPlan(null)
    toast.success(`${updated.name} plan updated`)
  }

  const totalMrr = plans.reduce(
    (sum, p) => sum + p.priceMonthly * p.activeSubscribers,
    0
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans & pricing"
        description="Manage subscription tiers available to clinics."
        actions={
          <Button
            className="bg-brand-gradient text-white border-none"
            onClick={() => toast.info('Add plan coming soon')}
          >
            <Plus className="h-4 w-4" data-icon="inline-start" />
            Add plan
          </Button>
        }
      />

      {/* Plan cards */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="grid grid-cols-1 gap-5 md:grid-cols-3"
      >
        {plans.map((plan) => {
          const isPro = plan.id === 'PLAN-PRO'
          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border bg-white p-6 ${
                isPro ? 'border-brand border-2' : 'border-line'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-gradient px-3 py-0.5 text-xs font-semibold text-white">
                    <Crown className="h-3 w-3" />
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold text-ink">
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-ink">
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-sm text-ink-faint">/month</span>
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  ${plan.priceYearly}/year (save{' '}
                  {Math.round(
                    (1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100
                  )}
                  %)
                </p>
              </div>

              <div className="mb-4 flex gap-4 text-xs text-ink-soft">
                <span className="flex items-center gap-1">
                  <UsersRound className="h-3.5 w-3.5 text-ink-faint" />
                  {plan.userLimit === 'unlimited'
                    ? 'Unlimited'
                    : `${plan.userLimit} users`}
                </span>
                <span className="flex items-center gap-1">
                  <Database className="h-3.5 w-3.5 text-ink-faint" />
                  {plan.patientLimit === 'unlimited'
                    ? 'Unlimited'
                    : `${(plan.patientLimit as number).toLocaleString()} patients`}
                </span>
              </div>

              <ul className="mb-5 space-y-2">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-ink-soft"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-line-soft pt-4">
                <span className="text-xs text-ink-faint">
                  {plan.activeSubscribers} active subscriber
                  {plan.activeSubscribers !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditPlan(plan)}
                >
                  <Pencil className="h-3.5 w-3.5" data-icon="inline-start" />
                  Edit
                </Button>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Revenue by plan */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <SectionCard
          title="Revenue by plan"
          description="Monthly recurring revenue breakdown"
        >
          <div className="space-y-3">
            {plans.map((plan) => {
              const rev = plan.priceMonthly * plan.activeSubscribers
              const pct = totalMrr > 0 ? (rev / totalMrr) * 100 : 0
              return (
                <div key={plan.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{plan.name}</span>
                    <span className="text-ink-soft">
                      {plan.activeSubscribers} × {formatCurrency(plan.priceMonthly, 'USD')} ={' '}
                      <span className="font-semibold text-ink">
                        {formatCurrency(rev, 'USD')}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line-soft">
                    <div
                      className="h-full rounded-full bg-brand-gradient"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="flex items-center justify-between border-t border-line-soft pt-3 text-sm">
              <span className="font-semibold text-ink">Total MRR</span>
              <span className="font-display text-lg font-bold text-ink">
                {formatCurrency(totalMrr, 'USD')}
              </span>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Edit SlideOver */}
      {editPlan && (
        <EditPlanSlideOver
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════
// Edit Plan SlideOver
// ═══════════════════════════════════════════════
function EditPlanSlideOver({
  plan,
  onClose,
  onSave,
}: {
  plan: Plan
  onClose: () => void
  onSave: (p: Plan) => void
}) {
  const [name, setName] = useState(plan.name)
  const [monthly, setMonthly] = useState(String(plan.priceMonthly))
  const [yearly, setYearly] = useState(String(plan.priceYearly))
  const [userLimit, setUserLimit] = useState(
    plan.userLimit === 'unlimited' ? 'unlimited' : String(plan.userLimit)
  )
  const [patientLimit, setPatientLimit] = useState(
    plan.patientLimit === 'unlimited' ? 'unlimited' : String(plan.patientLimit)
  )
  const [features, setFeatures] = useState<string[]>([...plan.features])
  const [newFeature, setNewFeature] = useState('')

  function handleSave() {
    onSave({
      ...plan,
      name,
      priceMonthly: Number(monthly) || plan.priceMonthly,
      priceYearly: Number(yearly) || plan.priceYearly,
      userLimit: userLimit === 'unlimited' ? 'unlimited' : Number(userLimit) || 10,
      patientLimit:
        patientLimit === 'unlimited' ? 'unlimited' : Number(patientLimit) || 500,
      features,
    })
  }

  return (
    <SlideOver
      open
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
      title={`Edit ${plan.name} Plan`}
      description="Changes are saved in-session only."
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-brand-gradient text-white border-none"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Plan Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Monthly Price ($)</Label>
            <Input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Yearly Price ($)</Label>
            <Input
              type="number"
              value={yearly}
              onChange={(e) => setYearly(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>User Limit</Label>
            <Input
              value={userLimit}
              onChange={(e) => setUserLimit(e.target.value)}
              placeholder="10 or unlimited"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Patient Limit</Label>
            <Input
              value={patientLimit}
              onChange={(e) => setPatientLimit(e.target.value)}
              placeholder="500 or unlimited"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Features</Label>
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={f}
                onChange={(e) => {
                  const next = [...features]
                  next[i] = e.target.value
                  setFeatures(next)
                }}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() =>
                  setFeatures(features.filter((_, idx) => idx !== i))
                }
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add a feature..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFeature.trim()) {
                  setFeatures([...features, newFeature.trim()])
                  setNewFeature('')
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (newFeature.trim()) {
                  setFeatures([...features, newFeature.trim()])
                  setNewFeature('')
                }
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </SlideOver>
  )
}
