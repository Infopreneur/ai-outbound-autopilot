'use client'

import { useState } from 'react'
import {
  Play,
  Sparkles,
  Clock,
  Layers,
  ChevronRight,
  Edit3,
  Share2,
  Eye,
  Plus,
  Search,
  Video,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockDemoTemplates } from '@/lib/mock-data'

const categories = ['All', 'Core Product', 'Value Selling', 'Discovery', 'Enterprise', 'Storytelling', 'Competitive']

const gradients = [
  'from-indigo-600/30 to-violet-600/30',
  'from-blue-600/30 to-cyan-600/30',
  'from-emerald-600/30 to-teal-600/30',
  'from-amber-600/30 to-orange-600/30',
  'from-pink-600/30 to-rose-600/30',
  'from-violet-600/30 to-purple-600/30',
]

export default function DemoStudioPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(mockDemoTemplates[0])
  const [personalization, setPersonalization] = useState<Record<string, string>>({})

  const filtered = mockDemoTemplates.filter((t) => {
    const matchCat    = selectedCategory === 'All' || t.category === selectedCategory
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="max-w-[1400px] space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Templates',    value: mockDemoTemplates.length.toString(), icon: <Layers className="w-4 h-4" />,  color: 'text-indigo-400  bg-indigo-500/10' },
          { label: 'Demos Sent',   value: '124',                               icon: <Share2 className="w-4 h-4" />,  color: 'text-blue-400   bg-blue-500/10' },
          { label: 'Avg View Time', value: '11.4m',                            icon: <Eye className="w-4 h-4" />,     color: 'text-violet-400 bg-violet-500/10' },
          { label: 'Demo → Deal',  value: '68%',                               icon: <Sparkles className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111120] border border-[#1e1e38] rounded-xl px-5 py-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Template gallery */}
        <div className="xl:col-span-2 space-y-4">
          {/* Toolbar */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search templates…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <Button variant="primary" size="sm">
                <Plus className="w-3.5 h-3.5" />
                New Template
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-500 hover:text-slate-300 bg-[#1a1a30] border border-[#252540]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Templates grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((template, i) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`bg-[#111120] border rounded-xl overflow-hidden cursor-pointer transition-all duration-150 ${
                  selectedTemplate.id === template.id
                    ? 'border-indigo-500/50 bg-[#13132a]'
                    : 'border-[#1e1e38] hover:border-[#252548]'
                }`}
              >
                {/* Thumbnail */}
                <div className={`h-36 bg-gradient-to-br ${gradients[i % gradients.length]} border-b border-[#1e1e38] flex items-center justify-center relative`}>
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Video className="w-7 h-7 text-white/40" />
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="indigo" className="text-[10px]">{template.category}</Badge>
                  </div>
                  <button className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </button>
                </div>

                <div className="p-4">
                  <div className="text-sm font-semibold text-white mb-1">{template.name}</div>
                  <div className="text-xs text-slate-500 line-clamp-2 mb-3">{template.description}</div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{template.duration}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{template.slides} slides</span>
                    <span className="flex items-center gap-1"><Wand2 className="w-3 h-3" />{template.personalization.length} vars</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Builder panel */}
        <div className="space-y-4">
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl overflow-hidden">
            <div className="border-b border-[#1e1e38] px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Demo Builder</h2>
                <Badge variant="indigo">{selectedTemplate.category}</Badge>
              </div>
              <div className="text-xs text-slate-500 mt-1">{selectedTemplate.name}</div>
            </div>

            <div className="p-5 space-y-4">
              {/* Personalization fields */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Personalization</div>
                <div className="space-y-3">
                  {selectedTemplate.personalization.map((field) => (
                    <div key={field}>
                      <label className="text-xs text-slate-400 font-medium mb-1 block">{field}</label>
                      <input
                        type="text"
                        placeholder={`Enter ${field.toLowerCase()}…`}
                        value={personalization[field] ?? ''}
                        onChange={(e) =>
                          setPersonalization((prev) => ({ ...prev, [field]: e.target.value }))
                        }
                        className="w-full h-9 px-3 bg-[#1a1a30] border border-[#252540] rounded-lg text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Generate */}
              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-indigo-300">AI Personalization</span>
                </div>
                <div className="text-xs text-slate-500 mb-3">
                  Let AI fill in personalization based on the prospect&apos;s profile.
                </div>
                <Button variant="primary" size="sm" className="w-full justify-center">
                  <Wand2 className="w-3.5 h-3.5" />
                  Auto-Personalize
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1a1a30] border border-[#252540] rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{selectedTemplate.duration}</div>
                  <div className="text-[10px] text-slate-600">Duration</div>
                </div>
                <div className="bg-[#1a1a30] border border-[#252540] rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-white">{selectedTemplate.slides}</div>
                  <div className="text-[10px] text-slate-600">Slides</div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button variant="primary" size="md" className="w-full justify-center">
                  <Play className="w-3.5 h-3.5" />
                  Preview Demo
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" className="justify-center">
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" className="justify-center">
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent demos */}
          <div className="bg-[#111120] border border-[#1e1e38] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Demos Sent</h3>
            <div className="space-y-2">
              {[
                { company: 'TechCorp Inc.', template: 'Enterprise Pitch', views: 3, time: '2h ago' },
                { company: 'Launchpad AI',  template: 'Quick Discovery Call', views: 1, time: '1d ago' },
                { company: 'GrowthHQ',      template: 'ROI Calculator',    views: 5, time: '2d ago' },
              ].map((demo) => (
                <div
                  key={demo.company}
                  className="flex items-center justify-between py-2 border-b border-[#14142a] last:border-0"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-300">{demo.company}</div>
                    <div className="text-[11px] text-slate-600">{demo.template}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">{demo.views} views</div>
                    <div className="text-[10px] text-slate-600">{demo.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
