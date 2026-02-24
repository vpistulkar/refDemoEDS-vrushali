import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment, moveInstrumentation } from '../../scripts/scripts.js';
import { readBlockConfig } from '../../scripts/aem.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Creates a background video element for the hero section
 * @param {string} videoSrc - Video source URL
 * @param {boolean} autoplay - Whether to autoplay the video
 * @returns {HTMLElement} Video element
 */
function createBackgroundVideo(videoSrc, autoplay = true) {
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.muted = true;
  video.loop = true;
  
  if (autoplay) {
    video.setAttribute('autoplay', '');
  }
  
  const source = document.createElement('source');
  source.setAttribute('src', videoSrc);
  source.setAttribute('type', 'video/mp4');
  video.appendChild(source);
  
  // Try to play if autoplay is enabled
  if (autoplay && !prefersReducedMotion.matches) {
    video.play().catch(() => {
      // Autoplay was prevented by browser policy
      console.warn('Video autoplay was prevented by browser policy');
    });
  }
  
  return video;
}

/**
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const properties = readBlockConfig(block);
  
  // Get the enable underline setting from the block content (3rd div)
  const enableUnderline = properties.enableunderline || block.querySelector(':scope div:nth-child(3) > div')?.textContent?.trim() || 'true';
  
  // Get the layout Style from the block content (4th div)
  const layoutStyle = properties.herolayout || block.querySelector(':scope div:nth-child(4) > div')?.textContent?.trim() || 'overlay';

  // Get the CTA style from the block content (5th div)
  const ctaStyle = properties.ctastyle || block.querySelector(':scope div:nth-child(5) > div')?.textContent?.trim() || 'default';

  const backgroundStyle = properties.backgroundstyle || block.querySelector(':scope div:nth-child(6) > div')?.textContent?.trim() || 'default';
  
  // Get background type - image or video
  const backgroundType = properties.backgroundtype || block.querySelector(':scope div:nth-child(7) > div')?.textContent?.trim() || 'image';
  
  // Get video reference if background type is video
  const videoReference = properties.videoreference || block.querySelector(':scope div:nth-child(8) > div')?.textContent?.trim() || '';
  
  // Get video behavior - autoplay or pause
  const videoBehavior = properties.videobehavior || block.querySelector(':scope div:nth-child(9) > div')?.textContent?.trim() || 'autoplay';
  const videoAutoplay = videoBehavior === 'autoplay';

  if(layoutStyle){
     block.classList.add(`${layoutStyle}`);
  }

  if(backgroundStyle){
    block.classList.add(`${backgroundStyle}`);
  }

  // Add removeunderline class if underline is disabled
  if (enableUnderline.toLowerCase() === 'false') {
    block.classList.add('removeunderline');
  }
  
  // Handle video background
  if (backgroundType === 'video' && videoReference) {
    // Find existing picture element (image background)
    const picture = block.querySelector('picture');
    
    // Create video element
    const video = createBackgroundVideo(videoReference, videoAutoplay);
    video.classList.add('hero-background-video');
    
    // Replace picture with video or insert video
    if (picture) {
      // Only replace if it's a background image (not in image-left/right layouts)
      const isBackgroundImage = !block.classList.contains('image-left') && 
                                !block.classList.contains('image-right') &&
                                !block.classList.contains('image-top') &&
                                !block.classList.contains('image-bottom');
      
      if (isBackgroundImage) {
        picture.replaceWith(video);
      } else {
        // For side-by-side layouts, hide the picture and add video as background
        picture.style.display = 'none';
        block.insertBefore(video, block.firstChild);
      }
    } else {
      // No picture found, insert video
      block.insertBefore(video, block.firstChild);
    }
  }
  
  // Find the button container within the hero block
  const buttonContainer = block.querySelector('p.button-container');
  
  if (buttonContainer) {
    // Add the CTA style class to the button container
    buttonContainer.classList.add(`cta-${ctaStyle}`);
  }
  
  // Hide the CTA style configuration paragraph
  const ctaStyleParagraph = block.querySelector('p[data-aue-prop="ctastyle"]');
  if (ctaStyleParagraph) {
    ctaStyleParagraph.style.display = 'none';
  }

  // Optional: Remove the configuration divs after reading them to keep the DOM clean
  const underlineDiv = block.querySelector(':scope div:nth-child(3)');
  if (underlineDiv) {
    underlineDiv.style.display = 'none';
  }
  
  const layoutStyleDiv = block.querySelector(':scope div:nth-child(4)');
  if (layoutStyleDiv) {
    layoutStyleDiv.style.display = 'none';
  }

  const ctaStyleDiv = block.querySelector(':scope div:nth-child(5)');
  if (ctaStyleDiv) {
    ctaStyleDiv.style.display = 'none';
  }

  const backgroundStyleDiv = block.querySelector(':scope div:nth-child(6)');
  if (backgroundStyleDiv) {
    backgroundStyleDiv.style.display = 'none';
  }
  
  // Hide background type, video reference, and video behavior divs
  const backgroundTypeDiv = block.querySelector(':scope div:nth-child(7)');
  if (backgroundTypeDiv) {
    backgroundTypeDiv.style.display = 'none';
  }
  
  const videoReferenceDiv = block.querySelector(':scope div:nth-child(8)');
  if (videoReferenceDiv) {
    videoReferenceDiv.style.display = 'none';
  }
  
  const videoBehaviorDiv = block.querySelector(':scope div:nth-child(9)');
  if (videoBehaviorDiv) {
    videoBehaviorDiv.style.display = 'none';
  }

}
