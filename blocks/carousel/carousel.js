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
  
  // First pass: collect all rows with image content from rows 0-3
  const imageRows = [];
  [...block.children].forEach((row, index) => {
    if (index > 0 && index <= 3) {  // Rows 1-3
      const hasImage = row.querySelector('img') || row.querySelector('picture');
      if (hasImage) {
        imageRows.push(row);
        console.log('Found image in row', index, '- will inject into carousel items');
      }
    }
  });
  
  [...block.children].forEach((row) => {
    if (i > 3) {
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
      
      // If the cards-card-image div is empty and we have images from rows 1-3, inject one
      const imageDiv = li.querySelector('.cards-card-image');
      if (imageDiv && !imageDiv.querySelector('img, picture') && imageRows.length > 0) {
        const imageRow = imageRows.shift(); // Take first available image row
        const imageContent = imageRow.querySelector('div'); // Get first div which contains the image
        if (imageContent) {
          console.log('Injecting image from row into carousel item', i);
          // Move all children from the image content div into the carousel item's image div
          while (imageContent.firstChild) {
            imageDiv.appendChild(imageContent.firstChild);
          }
        }
      }
      
      slider.append(li);
    } else {
      // Skip rows that contain images (they'll be injected into carousel items instead)
      const hasImage = row.querySelector('img') || row.querySelector('picture');
      if (!hasImage) {
        if (row.firstElementChild.firstElementChild) {
          leftContent.append(row.firstElementChild.firstElementChild);
        }
        if (row.firstElementChild) {
          leftContent.append(row.firstElementChild.firstElementChild || '');
        }
        leftContent.className = 'default-content-wrapper';
      } else {
        console.log('Skipping row', i, 'with image from leftContent - will inject into carousel');
      }
    }
    i += 1;
  });

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
