(function(){
    
    const btn  = document.getElementById('moreOptions');
    const menu = document.getElementById('moreMenu');

    function closeMenu(){
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    }

    function toggleMenu(){
        const open = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');

        if (open){
            (menu.querySelector('a') || btn).focus();
        }
    }

    btn?.addEventListener('click', e => {
        e.stopPropagation(); toggleMenu();
    });

    document.addEventListener('click', e => {
        if (!menu.contains(e.target) && e.target !== btn){
            closeMenu();
        } 
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape'){
            closeMenu();
        }
    });

})();

document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-logout]');
    if (!link) return;
    e.preventDefault();
    document.getElementById('logoutForm')?.submit();
});
