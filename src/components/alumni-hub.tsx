'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe } from '@/components/ui/globe'
import { AlumniSupportMechanism } from '@/components/alumni-support-mechanism'
import { generateMockAlumniData, AlumniData } from '@/lib/mock-alumni-data'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Briefcase,
  MapPin,
  Users,
  TrendingUp,
} from 'lucide-react'
import { COBEOptions } from 'cobe'

interface AlumniHubProps {
  institutionSlug: string
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

export function AlumniHub({ institutionSlug }: AlumniHubProps) {
  const [alumniData] = useState<AlumniData>(() => generateMockAlumniData(institutionSlug))

  // Configure Globe with alumni markers
  const globeConfig: COBEOptions = {
    width: 800,
    height: 800,
    onRender: () => {},
    devicePixelRatio: 2,
    phi: 0,
    theta: 0.3,
    dark: 0,
    diffuse: 0.4,
    mapSamples: 16000,
    mapBrightness: 1.2,
    baseColor: [0.1, 0.1, 0.1], // Dark base for bidaaya-dark theme
    markerColor: [251 / 255, 100 / 255, 21 / 255], // bidaaya-accent orange
    glowColor: [251 / 255, 100 / 255, 21 / 255],
    markers: alumniData.locations.map(loc => ({
      location: loc.location,
      size: loc.size,
    })),
  }

  return (
    <div className="space-y-8">
      {/* Globe Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-8 border border-slate-800 relative overflow-hidden"
        style={{ minHeight: '500px' }}
      >
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="h-5 w-5 text-bidaaya-accent" />
          <h2 className="text-xl font-light text-white tracking-tight">
            Alumni Locations Worldwide
          </h2>
        </div>
        
        <div className="relative w-full h-[500px] flex items-center justify-center">
          <Globe config={globeConfig} className="relative" />
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-bidaaya-accent" />
            <span>{alumniData.locations.length} Alumni Locations</span>
          </div>
        </div>
      </motion.div>

      {/* Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Types Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-xl p-6 border border-slate-800"
        >
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="h-5 w-5 text-bidaaya-accent" />
            <h2 className="text-xl font-light text-white tracking-tight">
              By Job Type
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={alumniData.jobTypes}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis 
                dataKey="type" 
                type="category" 
                stroke="#94a3b8" 
                width={100}
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Roles Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel rounded-xl p-6 border border-slate-800"
        >
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-bidaaya-accent" />
            <h2 className="text-xl font-light text-white tracking-tight">
              By Role
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={alumniData.roles.slice(0, 8)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ role, percent }) => `${role}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {alumniData.roles.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Countries Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-xl p-6 border border-slate-800"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-bidaaya-accent" />
          <h2 className="text-xl font-light text-white tracking-tight">
            By Country
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {alumniData.countries.map((country, index) => (
            <div
              key={country.country}
              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium text-sm">{country.country}</span>
                <span className="text-bidaaya-accent font-semibold">{country.count}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-bidaaya-accent h-2 rounded-full transition-all"
                  style={{
                    width: `${(country.count / alumniData.countries[0].count) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Alumni Support Mechanism */}
      <AlumniSupportMechanism />
    </div>
  )
}

