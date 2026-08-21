// Images configuration for the SIGHT ISIMM website
export const aboutImages = {
  // Mission & Vision section image
  mission: {
    src: "/logos/sight_logo.png",
    alt: "SIGHT ISIMM Logo",
    width: 600,
    height: 500,
    className: "relative rounded-3xl shadow-2xl object-contain",
  },
  
  // Photo Gallery images - you can add up to 12 images
  gallery: [
    {
      src: "/images/events/international-sight-day.jpg", // Event/Activity 1
      alt: "International Sight Day",
      title: "International Sight Day",
      width: 300,
      height: 300,
    },
    {
      src: "/images/events/blender.jpg", // Event/Activity 2
      alt: "Blender Workshop", 
      title: "Blender Workshop",
      width: 300,
      height: 300,
    },
    {
      src: "/images/events/3ich-ieee.jpg", // Event/Activity 3
      alt: "3ich IEEE 1.0",
      title: "3ich IEEE 1.0",
      width: 300,
      height: 300,
    },
    {
      src: "/images/events/its-benefits.jpg", // Event/Activity 4
      alt: "ITS Benefits",
      title: "ITS Benefits",
      width: 300,
      height: 300,
    },
    {
      src: "/images/events/3ich-ieee-2.jpg", // Event/Activity 5
      alt: "3ich IEEE 2.0",
      title: "3ich IEEE 2.0",
      width: 300,
      height: 300,
    },
  ],
} as const

// Committee images configuration
export const committeeImages = {
  // Committee member photos - Updated with actual SIGHT ISIMM committee members
  members: [
    {
      name: "Wassim Zili",
      position: "Chairman",
      image: "/images/committee/wassim_zili.PNG", 
      facebook: "https://www.facebook.com/wassim.zili.1", // TODO: Add Facebook link
      email: "ziliwassim47@gmail.com", // TODO: Verify email
      linkedin: "https://www.linkedin.com/in/wassim-zili-88646a34a/", // TODO: Add LinkedIn link
    },
    {
      name: "Mohamed Sadok Bouslama",
      position: "Vice Chair",
      image: "/images/committee/mohamed_sadok_bouslama.png", 
      facebook: "https://www.facebook.com/medsadok.bouslama", // TODO: Add Facebook link
      email: "medsadook90@gmail.com", // TODO: Verify email
      linkedin: "https://www.linkedin.com/in/mohamed-sadok-bouslama-0902a536a/", // TODO: Add LinkedIn link
    },
    {
      name: "Maram Baccouche",
      position: "Secretary",
      image: "/images/committee/maram_baccouche.png", 
      facebook: "https://www.facebook.com/maram.baccouche.2025", // TODO: Add Facebook link
      email: "marambaccouche0@gmail.com", // TODO: Verify email
      linkedin: "https://www.linkedin.com/in/baccouche-maram-56131935a/", // TODO: Add LinkedIn link
    },
    {
      name: "Hamza Khadija",
      position: "Treasurer",
      image: "/images/committee/hamza_khadija.png", 
      facebook: "https://www.facebook.com/hamza.khadija.1848", // TODO: Add Facebook link
      email: "hamza.khadija20199@gmail.com", // TODO: Verify email
      linkedin: "https://www.linkedin.com/in/hamza-khadija-099a1a395/", // TODO: Add LinkedIn link
    },
    {
      name: "Mahmoud Balbali",
      position: "Webmaster",
      image: "/images/committee/mahmoud_balbali.PNG", 
      facebook: "https://www.facebook.com/mahmoud.balbali", // TODO: Add Facebook link
      email: "balbalimahmoud@gmail.com", // TODO: Verify email
      linkedin: "https://www.linkedin.com/in/mahmoud-balbali-452256389/", // TODO: Add LinkedIn link
    },
    {
      name: "Amani Rais",
      position: "HR Manager",
      image: "/images/committee/amani_rais.png", 
      facebook: "https://www.facebook.com/amani.amona.31392", // TODO: Add Facebook link
      email: "amanirais2005@gmail.com", // TODO: Verify email
      linkedin: "", // TODO: Add LinkedIn link
    },
    {
      name: "Saif Balbali",
      position: "Project Coordinator",
      image: "/images/committee/saif_balbali.png", 
      facebook: "https://www.facebook.com/saifbalbali", // TODO: Add Facebook link
      email: "saifbalbali20@gmail.com", // TODO: Verify email
      linkedin: "", // TODO: Add LinkedIn link
    },
  ],
  
  // Chair photo for leadership message section
  chair: {
    src: "/images/committee/wassim_zili.PNG",
    alt: "Wassim Zili - Chairman",
    width: 80,
    height: 80,
    className: "w-16 h-16 rounded-full object-cover mr-4",
  },
} as const

// Helper function to get gallery images (with fallback to placeholders)
export const getGalleryImages = () => {
  return aboutImages.gallery.map((image, index) => ({
    ...image,
    // Fallback to placeholder if image doesn't exist
    src: image.src.startsWith('/placeholder') ? image.src : image.src,
  }))
}

// Helper function to get committee members with fallback images
export const getCommitteeMembers = () => {
  return committeeImages.members.map((member, index) => ({
    ...member,
    // Fallback to placeholder if image doesn't exist
    image: member.image.startsWith('/placeholder') ? member.image : member.image,
  }))
}