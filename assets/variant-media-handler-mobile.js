// @ts-nocheck
class VariantMediaHandlerMobile {
  constructor() {
    this.variantData = [];
    this.productMedia = [];
    this.currentVariantId = null;
    this.currentSlideIndex = 0;
    this.mediaGallery = null;
    this.carouselContainer = null;
    this.dotsContainer = null;
    this.thumbnailsContainer = null;
    this.isUpdating = false;
    
    console.log('[VariantMedia] 🚀 Constructor initialized');
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    console.log('[VariantMedia] 🔧 Setup started');
    
    this.loadDataFromJSON();
    this.mediaGallery = document.querySelector('.variant-media-gallery--miniaturas');
    
    console.log('[VariantMedia] 📦 Gallery element:', this.mediaGallery ? '✅ Found' : '❌ Not found');
    
    if (!this.mediaGallery) return;

    this.createCarouselStructure();
    this.setupVariantListeners();
    this.loadInitialVariant();
    this.setupScrollHandlers();
    
    console.log('[VariantMedia] ✅ Setup complete');
  }

  loadDataFromJSON() {
    const dataScript = document.querySelector('#variant-metafields-data');
    if (!dataScript) {
      console.error('[VariantMedia] ❌ JSON script not found');
      return;
    }

    try {
      const data = JSON.parse(dataScript.textContent.trim());
      this.variantData = data.variants || [];
      this.productMedia = data.media || [];
      
      console.log('[VariantMedia] 📊 Data loaded:', {
        variants: this.variantData.length,
        media: this.productMedia.length,
        variantDetails: this.variantData.map(v => ({
          id: v.id,
          title: v.title,
          customImages: v.customImages?.length || 0
        }))
      });
    } catch (error) {
      console.error('[VariantMedia] ❌ JSON parse error:', error);
    }
  }

  createCarouselStructure() {
    console.log('[VariantMedia] 🏗️ Creating carousel structure...');
    
    const noscript = this.mediaGallery.querySelector('noscript');
    if (noscript) noscript.remove();
    this.mediaGallery.innerHTML = '';

    // Desktop: Thumbnails
    if (window.innerWidth >= 750) {
      this.thumbnailsContainer = document.createElement('div');
      this.thumbnailsContainer.className = 'variant-thumbnails';
      const thumbnailsList = document.createElement('ul');
      thumbnailsList.className = 'variant-thumbnails__list';
      this.thumbnailsContainer.appendChild(thumbnailsList);
      this.mediaGallery.appendChild(this.thumbnailsContainer);
      console.log('[VariantMedia] 🖥️ Desktop thumbnails created');
    }

    // Carousel
    this.carouselContainer = document.createElement('div');
    this.carouselContainer.className = 'variant-carousel';
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'variant-carousel__slides';
    this.carouselContainer.appendChild(slidesContainer);
    this.mediaGallery.appendChild(this.carouselContainer);

    // Mobile: Dots
    if (window.innerWidth < 750) {
      this.dotsContainer = document.createElement('div');
      this.dotsContainer.className = 'variant-carousel__dots';
      this.mediaGallery.appendChild(this.dotsContainer);
      console.log('[VariantMedia] 📱 Mobile dots created');
    }
  }

  setupVariantListeners() {
    console.log('[VariantMedia] 👂 Setting up variant listeners...');
    
    document.addEventListener('variant:update', (e) => {
      console.log('[VariantMedia] 🔔 variant:update event received:', e.detail);
      
      if (e.detail?.variant?.id) {
        console.log('[VariantMedia] ➡️ Calling updateMedia with ID:', e.detail.variant.id);
        this.updateMedia(e.detail.variant.id);
      } else {
        console.warn('[VariantMedia] ⚠️ No variant ID in event detail');
      }
    });

    const variantSelect = document.querySelector('select[name="id"]');
    if (variantSelect) {
      console.log('[VariantMedia] ✅ Select element found');
      variantSelect.addEventListener('change', (e) => {
        const variantId = parseInt(e.target.value);
        console.log('[VariantMedia] 📝 Select changed to:', variantId);
        this.updateMedia(variantId);
      });
    } else {
      console.log('[VariantMedia] ℹ️ No select element (using buttons?)');
    }
  }

  setupScrollHandlers() {
    if (window.innerWidth >= 750) return;
    const slidesContainer = this.carouselContainer?.querySelector('.variant-carousel__slides');
    if (!slidesContainer) return;

    let scrollTimeout;
    slidesContainer.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.updateActiveSlideFromScroll(), 100);
    });
  }

  updateActiveSlideFromScroll() {
    const slidesContainer = this.carouselContainer.querySelector('.variant-carousel__slides');
    if (!slidesContainer) return;

    const currentIndex = Math.round(slidesContainer.scrollLeft / slidesContainer.offsetWidth);
    if (currentIndex !== this.currentSlideIndex) {
      this.currentSlideIndex = currentIndex;
      this.updateActiveDot(currentIndex);
    }
  }

  loadInitialVariant() {
    console.log('[VariantMedia] 🎬 Loading initial variant...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const variantId = urlParams.get('variant');
    
    console.log('[VariantMedia] 🔍 URL variant param:', variantId);
    
    if (variantId) {
      const variant = this.variantData.find(v => v.id === parseInt(variantId));
      if (variant) {
        console.log('[VariantMedia] ✅ Found variant from URL:', variant.title);
        this.updateMedia(variant.id);
        return;
      }
    }

    if (this.variantData.length > 0) {
      console.log('[VariantMedia] ✅ Loading first variant:', this.variantData[0].title);
      this.updateMedia(this.variantData[0].id);
    }
  }

  updateMedia(variantId) {
    console.log('[VariantMedia] ════════════════════════════════');
    console.log('[VariantMedia] 🔄 UPDATE MEDIA CALLED');
    console.log('[VariantMedia] Current variant ID:', this.currentVariantId);
    console.log('[VariantMedia] New variant ID:', variantId);
    console.log('[VariantMedia] Is updating?', this.isUpdating);
    
    // Previne updates simultâneos
    if (this.isUpdating) {
      console.warn('[VariantMedia] ⚠️ Already updating, skipping...');
      return;
    }
    
    if (this.currentVariantId === variantId) {
      console.warn('[VariantMedia] ⚠️ Same variant, skipping...');
      return;
    }
    
    this.isUpdating = true;
    this.currentVariantId = variantId;
    this.currentSlideIndex = 0;
    
    const variant = this.variantData.find(v => v.id === variantId);
    
    if (!variant) {
      console.error('[VariantMedia] ❌ Variant not found in data!');
      this.isUpdating = false;
      return;
    }

    console.log('[VariantMedia] ✅ Variant found:', {
      id: variant.id,
      title: variant.title,
      featuredMedia: variant.featured_media_id,
      customImages: variant.customImages?.length || 0
    });

    const sortedMedia = this.buildSortedMediaArray(variant);
    
    console.log('[VariantMedia] 📸 Sorted media array:', {
      total: sortedMedia.length,
      sources: sortedMedia.map(m => m.source)
    });
    
    // CRÍTICO: Se não há mídia, mostra erro visual
    if (sortedMedia.length === 0) {
      console.error('[VariantMedia] ❌ No media found!');
      this.showEmptyState();
      this.isUpdating = false;
      return;
    }

    // Limpa estado anterior
    console.log('[VariantMedia] 🧹 Clearing carousel...');
    this.clearCarousel();

    // Aguarda um frame antes de renderizar
    console.log('[VariantMedia] ⏳ Waiting for animation frame...');
    requestAnimationFrame(() => {
      console.log('[VariantMedia] 🎨 Rendering carousel...');
      
      this.updateCarousel(sortedMedia);
      
      if (window.innerWidth >= 750) {
        console.log('[VariantMedia] 🖥️ Updating desktop thumbnails...');
        this.updateDesktopThumbnails(sortedMedia);
      } else {
        console.log('[VariantMedia] 📱 Updating mobile dots...');
        this.updateDots(sortedMedia.length);
      }

      console.log('[VariantMedia] 🎯 Going to slide 0...');
      this.goToSlide(0);
      
      this.isUpdating = false;
      console.log('[VariantMedia] ✅ Update complete!');
      console.log('[VariantMedia] ════════════════════════════════');
    });
  }

  buildSortedMediaArray(variant) {
    const mediaArray = [];
    const usedMediaIds = new Set();
    let totalImages = 0;
    const MAX_IMAGES = 6;

    console.log('[VariantMedia] 🔨 Building sorted media array for:', variant.title);

    // 1. Featured media
    if (variant.featured_media_id && totalImages < MAX_IMAGES) {
      const featuredMedia = this.productMedia.find(m => m.id === variant.featured_media_id);
      if (featuredMedia) {
        console.log('[VariantMedia] ✓ Added featured media');
        mediaArray.push({ ...featuredMedia, source: 'variant-featured' });
        usedMediaIds.add(featuredMedia.id);
        totalImages++;
      }
    }

    // 2. Custom images from metafield (máximo 6 total)
    if (variant.customImages?.length > 0 && totalImages < MAX_IMAGES) {
      const remainingSlots = MAX_IMAGES - totalImages;
      const imagesToAdd = variant.customImages.slice(0, remainingSlots);
      
      console.log(`[VariantMedia] ✓ Adding ${imagesToAdd.length} custom images`);
      
      imagesToAdd.forEach((imageObj, index) => {
        mediaArray.push({
          id: `custom-${variant.id}-${index}`,
          media_type: 'image',
          src: imageObj.src,
          preview_image: {
            src: imageObj.src,
            aspect_ratio: imageObj.width / imageObj.height || 1,
            width: imageObj.width,
            height: imageObj.height
          },
          alt: imageObj.alt || `${variant.title} - ${index + 1}`,
          source: 'metafield'
        });
        totalImages++;
      });
    }

    // 3. Other product media (até completar 6)
    if (totalImages < MAX_IMAGES) {
      let addedProductMedia = 0;
      for (const media of this.productMedia) {
        if (totalImages >= MAX_IMAGES) break;
        if (!usedMediaIds.has(media.id)) {
          mediaArray.push({ ...media, source: 'product' });
          totalImages++;
          addedProductMedia++;
        }
      }
      if (addedProductMedia > 0) {
        console.log(`[VariantMedia] ✓ Added ${addedProductMedia} product images`);
      }
    }

    console.log(`[VariantMedia] 📊 Final media array: ${mediaArray.length} images`);
    return mediaArray;
  }

  clearCarousel() {
    const slidesContainer = this.carouselContainer?.querySelector('.variant-carousel__slides');
    if (slidesContainer) {
      slidesContainer.innerHTML = '';
      console.log('[VariantMedia] ✓ Slides cleared');
    }

    const thumbnailsList = this.thumbnailsContainer?.querySelector('.variant-thumbnails__list');
    if (thumbnailsList) {
      thumbnailsList.innerHTML = '';
      console.log('[VariantMedia] ✓ Thumbnails cleared');
    }

    if (this.dotsContainer) {
      this.dotsContainer.innerHTML = '';
      console.log('[VariantMedia] ✓ Dots cleared');
    }
  }

  showEmptyState() {
    const slidesContainer = this.carouselContainer?.querySelector('.variant-carousel__slides');
    if (!slidesContainer) return;

    slidesContainer.innerHTML = `
      <div class="variant-carousel__slide">
        <div class="variant-slide__content" style="background:#f0f0f0; display:flex; align-items:center; justify-content:center;">
          <p style="color:#999;">Nenhuma imagem disponível</p>
        </div>
      </div>
    `;
    console.log('[VariantMedia] ⚠️ Empty state shown');
  }

  updateCarousel(mediaArray) {
    const slidesContainer = this.carouselContainer.querySelector('.variant-carousel__slides');
    if (!slidesContainer) {
      console.error('[VariantMedia] ❌ Slides container not found!');
      return;
    }

    console.log(`[VariantMedia] 🎠 Creating ${mediaArray.length} slides...`);

    mediaArray.forEach((media, index) => {
      const slide = this.createSlideElement(media, index);
      slidesContainer.appendChild(slide);
      if (window.innerWidth >= 750 && index === 0) {
        slide.classList.add('active');
      }
    });
    
    console.log('[VariantMedia] ✓ Carousel updated');
  }

  createSlideElement(media, index) {
    const slide = document.createElement('div');
    slide.className = 'variant-carousel__slide';
    slide.dataset.index = index;

    const src = media.src || media.preview_image?.src || '';
    if (!src) {
      console.warn(`[VariantMedia] ⚠️ No src for slide ${index}`);
      return slide;
    }

    const alt = media.alt || `Imagem ${index + 1}`;
    const loading = index === 0 ? 'eager' : 'lazy';

    slide.innerHTML = `
      <div class="variant-slide__content">
        <img
          src="${src}"
          alt="${alt}"
          loading="${loading}"
          class="variant-slide__image"
          ${index === 0 ? 'fetchpriority="high"' : ''}
        />
      </div>
    `;

    return slide;
  }

  updateDesktopThumbnails(mediaArray) {
    if (!this.thumbnailsContainer) return;
    const thumbnailsList = this.thumbnailsContainer.querySelector('.variant-thumbnails__list');
    if (!thumbnailsList) return;

    console.log(`[VariantMedia] 🖼️ Creating ${mediaArray.length} thumbnails...`);

    mediaArray.forEach((media, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      
      button.type = 'button';
      button.className = 'variant-thumbnails__item';
      if (index === 0) button.classList.add('active');
      button.dataset.index = index;
      button.setAttribute('aria-label', `Ver imagem ${index + 1}`);

      const src = media.src || media.preview_image?.src || '';
      button.innerHTML = `<img src="${src}" alt="${media.alt || ''}" loading="lazy" />`;
      button.addEventListener('click', () => this.showDesktopSlide(index));

      li.appendChild(button);
      thumbnailsList.appendChild(li);
    });
    
    console.log('[VariantMedia] ✓ Thumbnails updated');
  }

  showDesktopSlide(index) {
    const slidesContainer = this.carouselContainer.querySelector('.variant-carousel__slides');
    if (!slidesContainer) return;

    const slides = slidesContainer.querySelectorAll('.variant-carousel__slide');
    const thumbnails = this.thumbnailsContainer?.querySelectorAll('.variant-thumbnails__item');

    slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
    thumbnails?.forEach((thumb, i) => thumb.classList.toggle('active', i === index));

    this.currentSlideIndex = index;
    console.log(`[VariantMedia] 🖼️ Desktop slide ${index} shown`);
  }

  updateDots(totalSlides) {
    if (!this.dotsContainer) return;

    if (totalSlides <= 1) {
      this.dotsContainer.style.display = 'none';
      return;
    }

    this.dotsContainer.style.display = 'flex';

    console.log(`[VariantMedia] 🔵 Creating ${totalSlides} dots...`);

    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'variant-carousel__dot';
      dot.dataset.index = i;
      dot.setAttribute('aria-label', `Ir para imagem ${i + 1}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => this.goToSlide(i));
      this.dotsContainer.appendChild(dot);
    }
    
    console.log('[VariantMedia] ✓ Dots updated');
  }

  goToSlide(index) {
    const slidesContainer = this.carouselContainer.querySelector('.variant-carousel__slides');
    if (!slidesContainer) return;

    const slides = slidesContainer.querySelectorAll('.variant-carousel__slide');
    if (!slides[index]) {
      console.warn(`[VariantMedia] ⚠️ Slide ${index} not found`);
      return;
    }

    if (window.innerWidth >= 750) {
      this.showDesktopSlide(index);
      return;
    }

    slidesContainer.scrollTo({
      left: slidesContainer.offsetWidth * index,
      behavior: 'smooth'
    });

    this.currentSlideIndex = index;
    this.updateActiveDot(index);
    console.log(`[VariantMedia] 📱 Scrolled to slide ${index}`);
  }

  updateActiveDot(index) {
    if (!this.dotsContainer) return;
    const dots = this.dotsContainer.querySelectorAll('.variant-carousel__dot');
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }
}

if (typeof window !== 'undefined') {
  window.VariantMediaHandlerMobile = VariantMediaHandlerMobile;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new VariantMediaHandlerMobile());
  } else {
    new VariantMediaHandlerMobile();
  }
}