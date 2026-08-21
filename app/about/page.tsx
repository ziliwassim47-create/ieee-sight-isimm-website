"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Target, Eye, Heart, Users, Lightbulb, Globe } from "lucide-react"
import { aboutImages } from "@/lib/images"

export default function AboutPage() {
  const observerRef = useRef<IntersectionObserver | null>(null)

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
              About <span className="text-red-700">SIGHT ISIMM</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Discover our journey, mission, and commitment to advancing humanitarian technology
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-on-scroll">
              <div className="flex items-center mb-6">
                <Target className="h-8 w-8 text-red-700 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                To develop and apply innovative technology solutions that address humanitarian challenges and improve the quality of life
                for communities worldwide. We strive to promote sustainable development through education, collaboration, and
                technological innovation while fostering partnerships that create lasting positive impact.
              </p>
              <div className="flex items-center mb-6">
                <Eye className="h-8 w-8 text-red-700 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                To create a world where technology serves as a powerful tool for humanitarian aid and sustainable development.
                We envision a future where innovative solutions bridge the gap between technological advancement and
                human welfare, creating equitable opportunities for all communities.
              </p>
            </div>
            <div className="animate-on-scroll">
              <div className="relative">
                <div className="absolute inset-0 bg-red-200 rounded-3xl transform -rotate-6"></div>
                <Image
                  src={aboutImages.mission.src}
                  alt={aboutImages.mission.alt}
                  width={aboutImages.mission.width}
                  height={aboutImages.mission.height}
                  className={aboutImages.mission.className}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Humanitarian Impact",
                description:
                  "We believe in creating technology solutions that directly improve lives and address humanitarian challenges.",
              },
              {
                icon: Users,
                title: "Collaboration",
                description:
                  "Building strong partnerships and networks that foster innovation and sustainable development.",
              },
              {
                icon: Lightbulb,
                title: "Innovation",
                description: "Encouraging creative thinking and innovative solutions to humanitarian challenges.",
              },
              {
                icon: Globe,
                title: "Sustainability",
                description: "Promoting sustainable development practices and long-term positive impact.",
              },
              {
                icon: Target,
                title: "Excellence",
                description:
                  "Striving for excellence in everything we do while maintaining high professional standards.",
              },
              {
                icon: Eye,
                title: "Leadership",
                description:
                  "Developing leadership skills and creating opportunities to lead in humanitarian technology.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group animate-on-scroll"
              >
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-200 transition-colors duration-300">
                  <value.icon className="h-8 w-8 text-red-700" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach - How SIGHT Creates Impact */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-50 rounded-full filter blur-3xl opacity-50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How <span className="text-red-700">SIGHT</span> Creates Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our systematic approach to developing humanitarian technology solutions that make a real difference
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Process Flow */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1: Identify */}
              <div className="relative animate-on-scroll">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-red-500 rounded-2xl transform rotate-6 opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-red-700 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
                      1
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Identify Needs</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We research and identify real humanitarian challenges in communities that need innovative solutions
                  </p>
                </div>
                {/* Connecting Line */}
                <div className="hidden lg:block absolute top-10 left-full w-full h-1 bg-gradient-to-r from-red-500 to-transparent -translate-x-1/2"></div>
              </div>

              {/* Step 2: Innovate */}
              <div className="relative animate-on-scroll" style={{ animationDelay: '0.1s' }}>
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-red-500 rounded-2xl transform -rotate-6 opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-red-700 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
                      2
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Innovate Solutions</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our team collaborates to design cutting-edge technology solutions tailored to each challenge
                  </p>
                </div>
                <div className="hidden lg:block absolute top-10 left-full w-full h-1 bg-gradient-to-r from-red-500 to-transparent -translate-x-1/2"></div>
              </div>

              {/* Step 3: Implement */}
              <div className="relative animate-on-scroll" style={{ animationDelay: '0.2s' }}>
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-red-500 rounded-2xl transform rotate-6 opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-red-700 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
                      3
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Implement Projects</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We bring ideas to life through hands-on development and community engagement
                  </p>
                </div>
                <div className="hidden lg:block absolute top-10 left-full w-full h-1 bg-gradient-to-r from-red-500 to-transparent -translate-x-1/2"></div>
              </div>

              {/* Step 4: Impact */}
              <div className="relative animate-on-scroll" style={{ animationDelay: '0.3s' }}>
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-red-500 rounded-2xl transform -rotate-6 opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-red-700 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
                      4
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Measure Impact</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We evaluate outcomes and continuously improve to maximize positive community impact
                  </p>
                </div>
              </div>
            </div>

            {/* Focus Areas */}
            <div className="mt-20">
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-12 animate-on-scroll">
                Our Technology Focus Areas
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Sustainable Development */}
                <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border-2 border-green-100 hover:border-green-300 transition-all duration-300 animate-on-scroll group">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Sustainable Development</h4>
                  <p className="text-gray-600 text-sm">
                    Clean energy, environmental monitoring, and sustainable agriculture technologies
                  </p>
                </div>

                {/* Education & Healthcare */}
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 animate-on-scroll group" style={{ animationDelay: '0.1s' }}>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Education & Healthcare</h4>
                  <p className="text-gray-600 text-sm">
                    E-learning platforms, telemedicine solutions, and accessible health monitoring systems
                  </p>
                </div>

                {/* Community Empowerment */}
                <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 animate-on-scroll group" style={{ animationDelay: '0.2s' }}>
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Community Empowerment</h4>
                  <p className="text-gray-600 text-sm">
                    Digital literacy programs, entrepreneurship tools, and connectivity solutions
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 text-center animate-on-scroll">
              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-8 border border-red-200">
                <p className="text-lg text-gray-700 font-medium mb-4">
                  Every solution begins with understanding the community's unique needs
                </p>
                <p className="text-gray-600">
                  Join us in creating technology that truly serves humanity
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-red-700 to-red-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Mission</h2>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              Be part of a dedicated network of humanitarian technology innovators who are making a difference. Together, we can develop
              solutions that address global challenges and create positive impact for communities worldwide.
            </p>
            <div className="flex justify-center">
              <Link 
                href="https://docs.google.com/forms/d/e/1FAIpQLSdTniKT8Ex2SywG5WxtNNolIkvKwgYA-szdxpXLBAOSl1qqPA/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-red-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 hover:scale-105 transform transition-all inline-block"
              >
                Get Involved
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
