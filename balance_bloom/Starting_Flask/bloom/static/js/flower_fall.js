/*this file makes flowers fall when you click on the BALANCE BLOOM header*/

document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('h1.logo');

  if (!logo) return; // safety check

  logo.style.cursor = 'pointer';

  logo.addEventListener('click', () => {
    for(let i = 0; i < 30; i++) {
      createFlower();
    }
  });

  function createFlower() {
    const flower = document.createElement('div');
    flower.classList.add('flower');
    flower.textContent = ['🌸', '🌼', '🌺', '🌻'][Math.floor(Math.random() * 4)];
    flower.style.left = Math.random() * window.innerWidth + 'px';
    flower.style.top = '-30px';
    flower.style.fontSize = (15 + Math.random() * 20) + 'px';
    flower.style.animationDuration = (3 + Math.random() * 2) + 's';

    document.body.appendChild(flower);

    flower.addEventListener('animationend', () => {
      flower.remove();
    });
  }
});
