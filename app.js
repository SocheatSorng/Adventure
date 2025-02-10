document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('gameTable');
    const magnifier = document.getElementById('magnifier');
    
    // Array of available image names
    const imageNames = Array.from({length: 64}, (_, i) => `${i + 1}.jpeg`);

    // Create and append all cells at once using DocumentFragment
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 64; i++) {
        const img = document.createElement('img');
        img.src = `images/${imageNames[i]}`;
        img.alt = `Event ${i + 1}`;
        table.rows[Math.floor(i / 8)].cells[i % 8].appendChild(img);
    }

    // Use event delegation for better performance
    table.addEventListener('mousemove', e => {
        const img = e.target.closest('img');
        if (!img) return;

        const rect = img.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Use requestAnimationFrame for smooth magnifier updates
        requestAnimationFrame(() => {
            magnifier.style.display = 'block';
            magnifier.style.left = `${e.pageX - 75}px`;
            magnifier.style.top = `${e.pageY - 75}px`;
            
            const bgX = (x / rect.width) * 100;
            const bgY = (y / rect.height) * 100;
            
            magnifier.style.backgroundImage = `url(${img.src})`;
            magnifier.style.backgroundSize = '300%';
            magnifier.style.backgroundPosition = `${bgX}% ${bgY}%`;
        });
    });

    // Single event listener for mouseleave using event delegation
    table.addEventListener('mouseleave', e => {
        if (e.target.closest('img')) {
            magnifier.style.display = 'none';
        }
    });
});
