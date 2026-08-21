"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { ArrowRight, Globe, Target, Heart, Users, Leaf, Droplets, Zap, BookOpen, Scale, Home, TreePine, Fish, Mountain, Sun, Wind, Shield, X, Sparkles } from "lucide-react"

interface SDG {
  id: number
  title: string
  shortTitle: string
  description: string
  color: string
  bgColor: string
  icon: React.ComponentType<any>
  image: string
  targets: string[]
  technologyImpact: string
}

const sdgs: SDG[] = [
  {
    id: 1,
    title: "No Poverty",
    shortTitle: "End poverty in all its forms everywhere",
    description: "End poverty in all its forms everywhere. More than 700 million people still live in extreme poverty and are struggling to fulfill the most basic needs like health, education, and access to water and sanitation.",
    color: "from-red-500 to-red-700",
    bgColor: "bg-red-600",
    icon: Heart,
    image: "/images/sdgs/sdg1.png",
    targets: ["Eradicate extreme poverty", "Reduce poverty by at least 50%", "Implement social protection systems"],
    technologyImpact: "Digital financial services, mobile banking, and e-commerce platforms help provide financial inclusion and economic opportunities for the poor."
  },
  {
    id: 2,
    title: "Zero Hunger",
    shortTitle: "End hunger, achieve food security and improved nutrition",
    description: "End hunger, achieve food security and improved nutrition and promote sustainable agriculture. Hunger is the leading cause of death in the world.",
    color: "from-orange-500 to-orange-700",
    bgColor: "bg-amber-500",
    icon: Leaf,
    image: "/images/sdgs/sdg2.png",
    targets: ["End hunger and malnutrition", "Double agricultural productivity", "Ensure sustainable food production"],
    technologyImpact: "Precision agriculture, IoT sensors, and AI-powered crop monitoring systems optimize food production and reduce waste."
  },
  {
    id: 3,
    title: "Good Health and Well-being",
    shortTitle: "Ensure healthy lives and promote well-being for all",
    description: "Ensure healthy lives and promote well-being for all at all ages. Health is fundamental to human development and well-being.",
    color: "from-green-500 to-green-700",
    bgColor: "bg-emerald-600",
    icon: Heart,
    image: "/images/sdgs/sdg3.png",
    targets: ["Reduce maternal mortality", "End preventable deaths", "Achieve universal health coverage"],
    technologyImpact: "Telemedicine, mobile health apps, and AI diagnostics improve healthcare access in remote areas."
  },
  {
    id: 4,
    title: "Quality Education",
    shortTitle: "Ensure inclusive and equitable quality education",
    description: "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all. Education is the foundation for improving people's lives and sustainable development.",
    color: "from-red-500 to-red-700",
    bgColor: "bg-rose-600",
    icon: BookOpen,
    image: "/images/sdgs/sdg4.png",
    targets: ["Ensure free primary and secondary education", "Increase number of qualified teachers", "Eliminate gender disparities"],
    technologyImpact: "E-learning platforms, virtual reality classrooms, and educational apps provide access to quality education anywhere."
  },
  {
    id: 5,
    title: "Gender Equality",
    shortTitle: "Achieve gender equality and empower all women and girls",
    description: "Achieve gender equality and empower all women and girls. Gender equality is not only a fundamental human right, but a necessary foundation for a peaceful, prosperous and sustainable world.",
    color: "from-pink-500 to-pink-700",
    bgColor: "bg-pink-500",
    icon: Users,
    image: "/images/sdgs/sdg5.png",
    targets: ["End discrimination against women", "Ensure equal participation", "Enhance use of enabling technology"],
    technologyImpact: "Digital platforms and mobile apps empower women with access to information, education, and economic opportunities."
  },
  {
    id: 6,
    title: "Clean Water and Sanitation",
    shortTitle: "Ensure availability and sustainable management of water",
    description: "Ensure availability and sustainable management of water and sanitation for all. Water scarcity affects more than 40 percent of people globally.",
    color: "from-blue-500 to-blue-700",
    bgColor: "bg-cyan-500",
    icon: Droplets,
    image: "/images/sdgs/sdg6.png",
    targets: ["Achieve universal access to safe drinking water", "Improve water quality", "Increase water-use efficiency"],
    technologyImpact: "Smart water management systems, IoT sensors, and water purification technologies ensure clean water access."
  },
  {
    id: 7,
    title: "Affordable and Clean Energy",
    shortTitle: "Ensure access to affordable, reliable, sustainable energy",
    description: "Ensure access to affordable, reliable, sustainable and modern energy for all. Energy is central to nearly every major challenge and opportunity.",
    color: "from-yellow-500 to-yellow-700",
    bgColor: "bg-yellow-500",
    icon: Zap,
    image: "/images/sdgs/sdg7.png",
    targets: ["Ensure universal access to energy", "Increase renewable energy share", "Improve energy efficiency"],
    technologyImpact: "Solar panels, smart grids, and energy storage solutions provide clean, affordable energy to communities."
  },
  {
    id: 8,
    title: "Decent Work and Economic Growth",
    shortTitle: "Promote sustained, inclusive and sustainable economic growth",
    description: "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all. Economic growth should be a positive force for the whole planet.",
    color: "from-red-500 to-red-700",
    bgColor: "bg-red-700",
    icon: Target,
    image: "/images/sdgs/sdg8.png",
    targets: ["Sustain per capita economic growth", "Achieve higher levels of productivity", "Promote development-oriented policies"],
    technologyImpact: "Digital platforms, e-commerce, and automation create new job opportunities and improve productivity."
  },
  {
    id: 9,
    title: "Industry, Innovation and Infrastructure",
    shortTitle: "Build resilient infrastructure, promote sustainable industrialization",
    description: "Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation. Investment in infrastructure and innovation are crucial drivers of economic growth and development.",
    color: "from-orange-500 to-orange-700",
    bgColor: "bg-orange-600",
    icon: Zap,
    image: "/images/sdgs/sdg9.png",
    targets: ["Develop quality infrastructure", "Promote inclusive industrialization", "Enhance scientific research"],
    technologyImpact: "3D printing, IoT, and smart manufacturing technologies drive innovation and sustainable industrialization."
  },
  {
    id: 10,
    title: "Reduced Inequalities",
    shortTitle: "Reduce inequality within and among countries",
    description: "Reduce inequality within and among countries. The international community has made significant strides towards lifting people out of poverty.",
    color: "from-red-500 to-red-700",
    bgColor: "bg-fuchsia-600",
    icon: Scale,
    image: "/images/sdgs/sdg10.png",
    targets: ["Achieve income growth for bottom 40%", "Promote social inclusion", "Ensure equal opportunities"],
    technologyImpact: "Digital platforms and mobile technologies bridge gaps and provide equal access to opportunities."
  },
  {
    id: 11,
    title: "Sustainable Cities and Communities",
    shortTitle: "Make cities and human settlements inclusive, safe, resilient",
    description: "Make cities and human settlements inclusive, safe, resilient and sustainable. Cities are hubs for ideas, commerce, culture, science, productivity, social development and much more.",
    color: "from-yellow-500 to-yellow-700",
    bgColor: "bg-amber-400",
    icon: Home,
    image: "/images/sdgs/sdg11.png",
    targets: ["Ensure access to adequate housing", "Provide sustainable transport systems", "Reduce environmental impact"],
    technologyImpact: "Smart city technologies, IoT sensors, and data analytics create sustainable, efficient urban environments."
  },
  {
    id: 12,
    title: "Responsible Consumption and Production",
    shortTitle: "Ensure sustainable consumption and production patterns",
    description: "Ensure sustainable consumption and production patterns. Sustainable consumption and production is about doing more and better with less.",
    color: "from-yellow-500 to-yellow-700",
    bgColor: "bg-orange-500",
    icon: Leaf,
    image: "/images/sdgs/sdg12.png",
    targets: ["Achieve sustainable management of natural resources", "Halve per capita food waste", "Ensure sustainable practices"],
    technologyImpact: "Circular economy technologies, waste tracking systems, and sustainable supply chain solutions reduce environmental impact."
  },
  {
    id: 13,
    title: "Climate Action",
    shortTitle: "Take urgent action to combat climate change and its impacts",
    description: "Take urgent action to combat climate change and its impacts. Climate change is now affecting every country on every continent.",
    color: "from-green-500 to-green-700",
    bgColor: "bg-green-600",
    icon: TreePine,
    image: "/images/sdgs/sdg13.png",
    targets: ["Strengthen resilience to climate hazards", "Integrate climate measures into policies", "Improve education and awareness"],
    technologyImpact: "Renewable energy technologies, carbon capture systems, and climate monitoring tools combat climate change."
  },
  {
    id: 14,
    title: "Life Below Water",
    shortTitle: "Conserve and sustainably use the oceans, seas and marine resources",
    description: "Conserve and sustainably use the oceans, seas and marine resources for sustainable development. The world's oceans drive global systems that make the Earth habitable for humankind.",
    color: "from-blue-500 to-blue-700",
    bgColor: "bg-blue-600",
    icon: Fish,
    image: "/images/sdgs/sdg14.png",
    targets: ["Prevent marine pollution", "Protect marine ecosystems", "Regulate harvesting and end overfishing"],
    technologyImpact: "Ocean monitoring systems, sustainable fishing technologies, and marine conservation tools protect ocean health."
  },
  {
    id: 15,
    title: "Life on Land",
    shortTitle: "Protect, restore and promote sustainable use of terrestrial ecosystems",
    description: "Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss.",
    color: "from-green-500 to-green-700",
    bgColor: "bg-lime-600",
    icon: Mountain,
    image: "/images/sdgs/sdg15.png",
    targets: ["Conserve terrestrial ecosystems", "Combat desertification", "Halt biodiversity loss"],
    technologyImpact: "Satellite monitoring, AI-powered conservation tools, and sustainable land management technologies protect ecosystems."
  },
  {
    id: 16,
    title: "Peace, Justice and Strong Institutions",
    shortTitle: "Promote peaceful and inclusive societies for sustainable development",
    description: "Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels.",
    color: "from-blue-500 to-blue-700",
    bgColor: "bg-sky-600",
    icon: Shield,
    image: "/images/sdgs/sdg16.png",
    targets: ["Reduce violence and related death rates", "End abuse and exploitation", "Develop effective institutions"],
    technologyImpact: "Digital governance platforms, transparency tools, and justice system technologies promote peace and accountability."
  },
  {
    id: 17,
    title: "Partnerships for the Goals",
    shortTitle: "Strengthen the means of implementation and revitalize partnerships",
    description: "Strengthen the means of implementation and revitalize the Global Partnership for Sustainable Development. A successful sustainable development agenda requires partnerships between governments, the private sector and civil society.",
    color: "from-blue-500 to-blue-700",
    bgColor: "bg-indigo-600",
    icon: Globe,
    image: "/images/sdgs/sdg17.png",
    targets: ["Mobilize financial resources", "Enhance technology cooperation", "Promote effective partnerships"],
    technologyImpact: "Digital collaboration platforms, knowledge sharing networks, and global partnerships accelerate SDG implementation."
  }
]

export default function SDGsPage() {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [selectedSDG, setSelectedSDG] = useState<SDG | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = document.querySelectorAll(".animate-on-scroll")
    elements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Sustainable Development <span className="text-red-700">Goals</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Discover the 17 Sustainable Development Goals.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive SDGs Showcase */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-red-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 animate-on-scroll">
            <div className="inline-flex items-center bg-white px-6 py-3 rounded-full shadow-md mb-6">
              <Sparkles className="h-5 w-5 text-red-700 mr-2" />
              <span className="text-gray-700 font-semibold">Click any goal to explore</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              17 Goals to Transform Our World
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover how technology drives sustainable development and humanitarian innovation
            </p>
          </div>

          {/* Compact Interactive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-w-7xl mx-auto">
            {sdgs.map((sdg, index) => (
              <Dialog key={sdg.id}>
                <DialogTrigger asChild>
                  <div
                    className="group cursor-pointer animate-on-scroll"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className={`relative ${sdg.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 overflow-hidden`}>
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -translate-y-10 translate-x-10"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full translate-y-8 -translate-x-8"></div>
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        {/* SDG Number - Large & Bold */}
                        <div className="text-white text-5xl font-black mb-3 opacity-90">
                          {sdg.id}
                        </div>
                        
                        {/* Icon */}
                        <div className="bg-white/20 backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                          <sdg.icon className="h-6 w-6 text-white" />
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-white font-bold text-sm leading-tight mb-1">
                          {sdg.title}
                        </h3>
                        
                        {/* Hover Indicator */}
                        <div className="flex items-center text-white/80 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="mr-1">Learn more</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogTrigger>

                {/* Modal Content */}
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[200]">
                  <DialogHeader>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`${sdg.bgColor} w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-2xl font-black">{sdg.id}</span>
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                          {sdg.title}
                        </DialogTitle>
                        <DialogDescription className="text-base text-gray-600 font-medium">
                          {sdg.shortTitle}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  {/* SDG Image */}
                  <div className="relative h-64 w-full rounded-xl overflow-hidden mb-6 bg-gray-100">
                    <Image
                      src={sdg.image}
                      alt={sdg.title}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/images/placeholder.jpg"
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">About This Goal</h4>
                    <p className="text-gray-700 leading-relaxed">{sdg.description}</p>
                  </div>

                  {/* Technology Impact */}
                  <div className="mb-6 bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border border-red-100">
                    <div className="flex items-center mb-3">
                      <div className="bg-red-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Technology Impact</h4>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{sdg.technologyImpact}</p>
                  </div>

                  {/* Key Targets */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Key Targets</h4>
                    <div className="space-y-3">
                      {sdg.targets.map((target, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`${sdg.bgColor} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <p className="text-gray-700 leading-relaxed flex-1">{target}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>

          {/* Bottom Info */}
          <div className="text-center mt-16 animate-on-scroll">
            <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Technology for Global Goals
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                At IEEE SIGHT ISIMM, we leverage cutting-edge technology to accelerate progress toward the SDGs.
                Each goal presents unique challenges that require innovative, sustainable solutions powered by engineering and technology.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="bg-red-50 px-4 py-2 rounded-full">
                  <span className="text-red-700 font-semibold text-sm">Innovation</span>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-full">
                  <span className="text-blue-700 font-semibold text-sm">Sustainability</span>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-full">
                  <span className="text-green-700 font-semibold text-sm">Impact</span>
                </div>
                <div className="bg-purple-50 px-4 py-2 rounded-full">
                  <span className="text-purple-700 font-semibold text-sm">Collaboration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 