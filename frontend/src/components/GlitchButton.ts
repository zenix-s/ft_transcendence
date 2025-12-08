export function GlitchButton(
    text: string,
    extraClasses: string = '',
    page: string = ''
): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `
	  relative bg-transparent text-secondary border border-secondary 
	  px-8 py-4 font-mono text-3xl sm:text-5xl skew-x-[5deg]
	  cursor-pointer transition-all duration-1000 shadow-none 
	  hover:shadow-[5px_0_5px_red,-5px_0_5px_blue] 
	  hover:text-shadow-[5px_0_0_red,-5px_0_0_blue] 
	  animate-[glitch_1s_linear_infinite]
	  dark:text-primary dark:border-primary ${extraClasses}
	`;
    if (page) {
        button.dataset.page = page;
    }
    return button;
}
