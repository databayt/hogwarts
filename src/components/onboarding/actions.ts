"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Amenity, Highlight, PropertyType } from '@prisma/client'
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { auth } from '@/auth'

export type ListingFormData = {
  title?: string
  description?: string
  pricePerNight?: number
  securityDeposit?: number
  applicationFee?: number
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  guestCount?: number
  propertyType?: PropertyType
  isPetsAllowed?: boolean
  isParkingIncluded?: boolean
  instantBook?: boolean
  amenities?: Amenity[]
  highlights?: Highlight[]
  photoUrls?: string[]
  // Location data
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  latitude?: number
  longitude?: number
  // Draft/publish flags
  draft?: boolean
  isPublished?: boolean
}

// Types for filtering
interface ListingFilters {
  location?: string
  priceRange?: [number, number]
  bedrooms?: number
  bathrooms?: number
  guestCount?: number
  propertyType?: PropertyType
  squareFeet?: [number, number]
  amenities?: Amenity[]
  availableFrom?: string
  coordinates?: [number, number] // [longitude, latitude]
  favoriteIds?: number[]
  publishedOnly?: boolean
}

export async function createListing(data: Partial<ListingFormData> = {}) {
  console.log('🏗️ === CREATE LISTING SERVER ACTION STARTED ===')
  console.log('📨 Received data:', data)
  
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to create a listing')
  }

  try {
    console.log('👤 Using authenticated user:', session.user.id)

    // Create location if provided
    let locationId = null
    if (data.address && data.city && data.state && data.country) {
      console.log('📍 Creating location...')
      const location = await db.location.create({
        data: {
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
        }
      })
      locationId = location.id
      console.log('✅ Location created:', location.id)
    }

    // Create listing
    console.log('🏠 Creating listing...')
    const listingData: Prisma.ListingCreateInput = {
      title: data.title,
      description: data.description,
      pricePerNight: data.pricePerNight,
      securityDeposit: data.securityDeposit,
      applicationFee: data.applicationFee,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      squareFeet: data.squareFeet,
      guestCount: data.guestCount || 2,
      propertyType: data.propertyType,
      isPetsAllowed: data.isPetsAllowed || false,
      isParkingIncluded: data.isParkingIncluded || false,
      instantBook: data.instantBook || false,
      amenities: data.amenities || [],
      highlights: data.highlights || [],
      photoUrls: data.photoUrls || [],
      draft: data.draft ?? true,
      isPublished: data.isPublished ?? false,
      host: { connect: { id: session.user.id } },
      ...(locationId && { location: { connect: { id: locationId } } })
    }
    
    const listing = await db.listing.create({
      data: listingData,
      include: {
        location: true,
        host: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        },
      }
    })
    console.log('✅ Listing created successfully:', listing.id)

    console.log('🔄 Revalidating paths...')
    revalidatePath('/host')
    revalidatePath('/search')
    
    console.log('🎉 === CREATE LISTING SUCCESS ===')
    return { success: true, listing }
  } catch (error) {
    console.error('💥 === CREATE LISTING ERROR ===')
    console.error('💥 Error creating listing:', error)
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    throw new Error(`Failed to create listing: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function updateListing(id: number, data: Partial<ListingFormData>) {
  console.log('🔄 === UPDATE LISTING SERVER ACTION STARTED ===')
  console.log('📨 Listing ID:', id)
  console.log('📨 Update data:', data)
  
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to update a listing')
  }
  
  try {
    // Check if the listing belongs to the authenticated user
    const existingListing = await db.listing.findUnique({
      where: { id },
      select: { hostId: true }
    })

    if (!existingListing) {
      throw new Error('Listing not found')
    }

    if (existingListing.hostId !== session.user.id) {
      throw new Error('You can only update your own listings')
    }
    // Handle location update if provided
    let locationUpdate = {}
    if (data.address || data.city || data.state || data.country) {
      const listing = await db.listing.findUnique({
        where: { id },
        include: { location: true }
      })

      if (!listing) {
        throw new Error('Listing not found')
      }

      if (listing.location) {
        // Update existing location
        await db.location.update({
          where: { id: listing.locationId! },
          data: {
            ...(data.address && { address: data.address }),
            ...(data.city && { city: data.city }),
            ...(data.state && { state: data.state }),
            ...(data.country && { country: data.country }),
            ...(data.postalCode && { postalCode: data.postalCode }),
            ...(data.latitude && { latitude: data.latitude }),
            ...(data.longitude && { longitude: data.longitude }),
          }
        })
      } else if (data.address && data.city && data.state && data.country) {
        // Create new location
        const location = await db.location.create({
          data: {
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            postalCode: data.postalCode || '',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
          }
        })
        locationUpdate = { location: { connect: { id: location.id } } }
      }
    }

    // Prepare listing update data
    const updateData: Prisma.ListingUpdateInput = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.pricePerNight !== undefined && { pricePerNight: data.pricePerNight }),
      ...(data.securityDeposit !== undefined && { securityDeposit: data.securityDeposit }),
      ...(data.applicationFee !== undefined && { applicationFee: data.applicationFee }),
      ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
      ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
      ...(data.squareFeet !== undefined && { squareFeet: data.squareFeet }),
      ...(data.guestCount !== undefined && { guestCount: data.guestCount }),
      ...(data.propertyType !== undefined && { propertyType: data.propertyType }),
      ...(data.isPetsAllowed !== undefined && { isPetsAllowed: data.isPetsAllowed }),
      ...(data.isParkingIncluded !== undefined && { isParkingIncluded: data.isParkingIncluded }),
      ...(data.instantBook !== undefined && { instantBook: data.instantBook }),
      ...(data.amenities !== undefined && { amenities: data.amenities }),
      ...(data.highlights !== undefined && { highlights: data.highlights }),
      ...(data.photoUrls !== undefined && { photoUrls: data.photoUrls }),
      ...(data.draft !== undefined && { draft: data.draft }),
      ...(data.isPublished !== undefined && { 
        isPublished: data.isPublished,
        ...(data.isPublished && { postedDate: new Date() })
      }),
      ...locationUpdate
    }

    const listing = await db.listing.update({
      where: { id },
      data: updateData,
      include: {
        location: true,
        host: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        },
      }
    })

    console.log('✅ Listing updated successfully:', listing.id)

    console.log('🔄 Revalidating paths...')
    revalidatePath('/host')
    revalidatePath(`/host/${id}`)
    revalidatePath('/search')
    
    return { success: true, listing }
  } catch (error) {
    console.error('💥 === UPDATE LISTING ERROR ===')
    console.error('💥 Error updating listing:', error)
    throw new Error(`Failed to update listing: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getListing(id: number) {
  try {
    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        location: true,
        host: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        },
      }
    })

    if (!listing) {
      throw new Error('Listing not found')
    }

    return listing
  } catch (error) {
    console.error('Error fetching listing:', error)
    throw new Error(`Failed to fetch listing: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getListings(filters?: ListingFilters) {
  try {
    const where: Prisma.ListingWhereInput = {}

    if (filters) {
      // Published filter
      if (filters.publishedOnly) {
        where.isPublished = true
        where.draft = false
      }

      // Location filtering
      if (filters.location) {
        where.location = {
          OR: [
            { city: { contains: filters.location, mode: 'insensitive' } },
            { state: { contains: filters.location, mode: 'insensitive' } },
            { address: { contains: filters.location, mode: 'insensitive' } },
          ]
        }
      }

      // Price range
      if (filters.priceRange) {
        where.pricePerNight = {
          gte: filters.priceRange[0],
          lte: filters.priceRange[1],
        }
      }

      // Bedrooms, bathrooms, guest count
      if (filters.bedrooms) where.bedrooms = { gte: filters.bedrooms }
      if (filters.bathrooms) where.bathrooms = { gte: filters.bathrooms }
      if (filters.guestCount) where.guestCount = { gte: filters.guestCount }

      // Property type
      if (filters.propertyType) where.propertyType = filters.propertyType

      // Square feet
      if (filters.squareFeet) {
        where.squareFeet = {
          gte: filters.squareFeet[0],
          lte: filters.squareFeet[1],
        }
      }

      // Amenities
      if (filters.amenities && filters.amenities.length > 0) {
        where.amenities = {
          hasEvery: filters.amenities
        }
      }

      // Coordinate-based filtering (within radius)
      if (filters.coordinates) {
        const [longitude, latitude] = filters.coordinates
        const radius = 0.1 // Adjust radius as needed
        where.location = {
          ...where.location,
          latitude: {
            gte: latitude - radius,
            lte: latitude + radius,
          },
          longitude: {
            gte: longitude - radius,
            lte: longitude + radius,
          },
        }
      }

      // Filter by favorites
      if (filters.favoriteIds && filters.favoriteIds.length > 0) {
        where.id = { in: filters.favoriteIds }
      }
    }

    const listings = await db.listing.findMany({
      where,
      include: {
        location: true,
        host: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        }
      },
      orderBy: {
        postedDate: 'desc'
      }
    })

    return listings
  } catch (error) {
    console.error('Error fetching listings:', error)
    throw new Error(`Failed to fetch listings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getHostListings(hostId?: string) {
  try {
    // Get the authenticated user from session
    const session = await auth()
    
    let userId: string;
    
    if (session?.user?.id) {
      // Use authenticated user's ID
      userId = hostId || session.user.id;
    } else {
      // Fallback to test user for development
      const testUser = await db.user.findUnique({
        where: { email: 'test@example.com' }
      });
      
      if (!testUser) {
        throw new Error('No authenticated user and no test user found');
      }
      
      userId = hostId || testUser.id;
    }

    const listings = await db.listing.findMany({
      where: {
        hostId: userId
      },
      include: {
        location: true,
        host: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        }
      },
      orderBy: {
        postedDate: 'desc'
      }
    })

    return listings
  } catch (error) {
    console.error('Error fetching host listings:', error)
    throw new Error(`Failed to fetch host listings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function deleteListing(id: number) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to delete a listing')
  }

  try {
    // Check if the listing belongs to the authenticated user
    const existingListing = await db.listing.findUnique({
      where: { id },
      select: { hostId: true }
    })

    if (!existingListing) {
      throw new Error('Listing not found')
    }

    if (existingListing.hostId !== session.user.id) {
      throw new Error('You can only delete your own listings')
    }

    await db.listing.delete({
      where: { id }
    })

    revalidatePath('/host')
    revalidatePath('/search')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting listing:', error)
    throw new Error(`Failed to delete listing: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function publishListing(id: number) {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('You must be logged in to publish a listing')
  }

  try {
    // Check if the listing belongs to the authenticated user
    const existingListing = await db.listing.findUnique({
      where: { id },
      select: { hostId: true }
    })

    if (!existingListing) {
      throw new Error('Listing not found')
    }

    if (existingListing.hostId !== session.user.id) {
      throw new Error('You can only publish your own listings')
    }

    // Validate listing completeness
    const listing = await db.listing.findUnique({
      where: { id },
      include: { location: true }
    })

    if (!listing) {
      throw new Error('Listing not found')
    }

    // Check required fields for publishing
    const requiredFields = ['title', 'description', 'pricePerNight', 'propertyType', 'bedrooms', 'bathrooms']
    const missingFields = requiredFields.filter(field => !listing[field as keyof typeof listing])
    
    if (missingFields.length > 0) {
      throw new Error(`Cannot publish listing. Missing required fields: ${missingFields.join(', ')}`)
    }

    if (!listing.location) {
      throw new Error('Cannot publish listing. Location is required')
    }

    if (!listing.photoUrls || listing.photoUrls.length === 0) {
      throw new Error('Cannot publish listing. At least one photo is required')
    }

    // Publish the listing
    const publishedListing = await db.listing.update({
      where: { id },
      data: {
        draft: false,
        isPublished: true,
        postedDate: new Date()
      },
      include: {
        location: true,
        host: {
          select: {
            id: true,
            email: true,
            username: true,
          }
        },
      }
    })

    revalidatePath('/host')
    revalidatePath(`/host/${id}`)
    revalidatePath('/search')
    
    return { success: true, listing: publishedListing }
  } catch (error) {
    console.error('Error publishing listing:', error)
    throw new Error(`Failed to publish listing: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
