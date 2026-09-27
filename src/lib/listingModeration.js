export function buildListingSubmissionPayload({
  title,
  description,
  price,
  category,
  productType,
  imageUrl,
  digitalFilePath,
  servicesIncluded,
  slug,
}) {
  return {
    title,
    description,
    price: Number(price),
    category,
    slug,
    images: imageUrl ? [imageUrl] : [],
    product_type: productType,
    digital_file_path: digitalFilePath || null,
    services_included: Array.isArray(servicesIncluded) && servicesIncluded.length ? servicesIncluded.filter((s) => String(s || '').trim()) : null,
    status: 'pending_review',
    is_active: false,
    moderation_reason: null,
  }
}
