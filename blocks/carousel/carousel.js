import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import createSlider from '../../scripts/slider.js';


function setCarouselItems(number) {
    document.querySelector('.carousel > ul')?.style.setProperty('--items-per-view', number);
}

export default function decorate(block) {
  let i = 0;
  setCarouselItems(2);
  const slider = document.createElement('ul');
  const leftContent = document.createElement('div');
  console.log('Carousel: Total rows:', block.children.length);
  
  // First pass: collect all rows with image content
  const imageRows = [];
  [...block.children].forEach((row, index) => {
    const hasImage = row.querySelector('img') || row.querySelector('picture');
    if (hasImage && index > 0) {  // Skip row 0, but collect image rows
      imageRows.push(row);
      console.log('Found image in row', index);
    }
  });
  
  [...block.children].forEach((row) => {
    console.log('Row', i, 'structure:', {
      childCount: row.children.length,
      html: row.innerHTML.substring(0, 200)
    });
    if (i > 3) {
      console.log('Carousel: Processing row', i, 'as carousel item');
      const li = document.createElement('li');
      
      // Read card style from the third div (index 2)
      const styleDiv = row.children[2];
      const styleParagraph = styleDiv?.querySelector('p');
      const cardStyle = styleParagraph?.textContent?.trim() || 'default';
      if (cardStyle && cardStyle !== 'default') {
        li.className = cardStyle;
      }
      
      // Read CTA style from the fourth div (index 3)
      const ctaDiv = row.children[3];
      const ctaParagraph = ctaDiv?.querySelector('p');
      const ctaStyle = ctaParagraph?.textContent?.trim() || 'default';

      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      
      // Process the li children to identify and style them correctly
      [...li.children].forEach((div, index) => {
        // First div (index 0) - Image
        if (index === 0) {
          div.className = 'cards-card-image';
        }
        // Second div (index 1) - Content with button
        else if (index === 1) {
          div.className = 'cards-card-body';
        }
        // Third div (index 2) - Card style configuration
        else if (index === 2) {
          div.className = 'cards-config';
          const p = div.querySelector('p');
          if (p) {
            p.style.display = 'none'; // Hide the configuration text
          }
        }
        // Fourth div (index 3) - CTA style configuration
        else if (index === 3) {
          div.className = 'cards-config';
          const p = div.querySelector('p');
          if (p) {
            p.style.display = 'none'; // Hide the configuration text
          }
        }
        // Any other divs
        else {
          div.className = 'cards-card-body';
        }
      });
      
      // Apply CTA styles to button containers
      const buttonContainers = li.querySelectorAll('p.button-container');
      buttonContainers.forEach(buttonContainer => {
        // Remove any existing CTA classes
        buttonContainer.classList.remove('default', 'cta-button', 'cta-button-secondary', 'cta-button-dark', 'cta-default');
        // Add the correct CTA class
        buttonContainer.classList.add(ctaStyle);
      });
      
      // If the cards-card-image div is empty and we have images from early rows, inject one
      const imageDiv = li.querySelector('.cards-card-image');
      if (imageDiv && !imageDiv.querySelector('img, picture') && imageRows.length > 0) {
        const imageRow = imageRows.shift(); // Take first available image row
        const imageContent = imageRow.querySelector('div'); // Get first div which contains the image
        if (imageContent) {
          console.log('Injecting image from early row into carousel item');
          while (imageContent.firstChild) {
            imageDiv.appendChild(imageContent.firstChild);
          }
        }
      }
      
      slider.append(li);
      console.log('Li element created with children:', li.children.length, 'HTML preview:', li.innerHTML.substring(0, 300));
    } else {
      console.log('Carousel: Row', i, 'added to leftContent (header area)');
      if (row.firstElementChild.firstElementChild) {
        leftContent.append(row.firstElementChild.firstElementChild);
      }
      if (row.firstElementChild) {
        leftContent.append(row.firstElementChild.firstElementChild || '');
      }
      leftContent.className = 'default-content-wrapper';
    }
    i += 1;
  });
  
  console.log('Carousel: Slider items created:', slider.children.length);
  console.log('Carousel: DM image links found:', slider.querySelectorAll('a[href^="https://delivery-p"]').length);
  console.log('Carousel: Regular pictures found:', slider.querySelectorAll('picture').length);
  console.log('Carousel: Plain img tags found:', slider.querySelectorAll('img:not(picture img)').length);

  // Handle plain img tags that aren't wrapped in picture elements
  slider.querySelectorAll('img:not(picture img)').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.replaceWith(optimizedPic);
  });

  // Handle pictures that need optimization
  slider.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  // Accessibility: preserve visual style but expose proper heading level to AT
  // Use aria-level so we don't change font sizes. Default to level 3, or infer from data-heading-level on the block.
  const base = parseInt(block?.dataset?.headingLevel, 10);
  const ariaLevel = Number.isFinite(base) ? Math.min(Math.max(base, 1) + 1, 6) : 3;
  slider.querySelectorAll('h4,h5,h6').forEach((node) => {
    node.setAttribute('role', 'heading');
    node.setAttribute('aria-level', String(ariaLevel));
  });

  block.textContent = '';
  block.parentNode.parentNode.prepend(leftContent);
  block.append(slider);
  createSlider(block);
}
