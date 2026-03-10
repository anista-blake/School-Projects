class UTCFormatter {
    static format(utcString, formatKey = 'long') {
        const utcDate = new Date(utcString);

        if (isNaN(utcDate)) {
            console.warn('UTCFormatter: Invalid date string:', utcString);
            return utcString;
        }

        const options = {};

        switch (formatKey) {
            case 'short':
                //Ex: Nov 17, 03:25 PM
                options.month = 'short';
                options.day = 'numeric';
                options.hour = '2-digit';
                options.minute = '2-digit';
                break;
            
            case 'medium':
                //Ex: Nov 17, 2025, 03:25 PM
                options.year = 'numeric';
                options.month = 'short';
                options.day = 'numeric';
                options.hour = '2-digit';
                options.minute = '2-digit';
                break;

            case 'date_only':
                //Ex: Nov 17, 2025
                options.year = 'numeric';
                options.month = 'short';
                options.day = 'numeric';
                break;
            
            case 'time_only':
                //Ex: 3:25 PM
                options.hour = '2-digit';
                options.minute = '2-digit';
                break;

            case 'day_only':
                //Ex: Monday
                options.weekday = 'long';
                break

            default: //'long'
                //Ex: Mon, Nov 17, 2025, 03:25 PM
                options.weekday = 'short';
                options.year = 'numeric';
                options.month = 'short';
                options.day = 'numeric';
                options.hour = '2-digit';
                options.minute = '2-digit';
        }

        return new Intl.DateTimeFormat(undefined, options).format(utcDate);
    }

    static initializeFormatters() {
        const elementsToFormat = document.querySelectorAll('[data-utc]:not(#last-seen-updater)');
        
        elementsToFormat.forEach(el => {
            const utcString = el.dataset.utc;
            
            const formatKey = el.dataset.format || 'long'; 

            if (utcString) {
                const formatted = UTCFormatter.format(utcString, formatKey);
                el.textContent = formatted;
            } else {
                console.warn('UTCFormatter: Element missing data-utc attribute.', el);
            }
        });
    }
}

//Locates all scripts with data-utc use
document.addEventListener('DOMContentLoaded', () => {
    UTCFormatter.initializeFormatters();
});