const imageInput = document.getElementById('imageInput');
const profileImage = document.getElementById('profileImage');

imageInput.addEventListener('change', function(){
    const file = this.files[0];

    if (file){
        const reader = new FileReader();
        reader.onload = function(e){
            profileImage.src = e.target.result;
            profileImage.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
});