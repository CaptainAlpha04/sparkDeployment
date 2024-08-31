import React from 'react'

function Footer() {
return (
    <section>
        <footer className="footer bg-base-300 text-base-content p-10 ">
        <nav>
            <h6 className="footer-title">Services</h6>
            <a className="link link-hover">Branding</a>
            <a className="link link-hover">Design</a>
            <a className="link link-hover">Marketing</a>
            <a className="link link-hover">Advertisement</a>
        </nav>
        <nav>
            <h6 className="footer-title">Company</h6>
            <a className="link link-hover">About us</a>
            <a className="link link-hover">Contact</a>
            <a className="link link-hover">Jobs</a>
            <a className="link link-hover">Press kit</a>
        </nav>
        <nav>
            <h6 className="footer-title">Legal</h6>
            <a className="link link-hover">Terms of use</a>
            <a className="link link-hover">Privacy policy</a>
            <a className="link link-hover">Cookie policy</a>
        </nav>
        <nav>
            <h6 className="footer-title">Sign Up for our Newsletter</h6>
            <p>Sign up to get awesome news and updates <br /> about our latest events</p>
            <div className="relative">
            <input type="text" className="w-full pr-36 input border-purple-600 input-bordered" placeholder="Email" />
            <button className="absolute top-0 right-0 btn bg-purple-600">Submit</button>
            </div>

        </nav>
        </footer>
        <footer className="footer bg-base-300 text-base-content border-base-300 border-t px-10 py-4">
        <aside className="grid-flow-col items-center">
        <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 92.41 97.5"
                className="w-12 h-12 text-current"
            >
                <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                    <path
                    className="fill-current"
                    d="M39.59,41.44,21.44,31.32,14.4,17,27,24.51l1.48.88ZM16,44.28l-1.68.37L0,47.76l14.92,5.65,20.17-5Zm57.32,0-1.68.37L57.32,47.76l14.92,5.65,20.17-5ZM68.62,64.82,67.12,64,54.35,56.78l7.39,14.14,18.39,9.67ZM50.06,76.32,46.28,60.37,41.54,77.76q2,9.87,4,19.74Q47.79,86.91,50.06,76.32Zm1.08-60.38L47.35,0,42.62,17.39q2,9.87,4,19.74Q48.87,26.54,51.14,15.94ZM13.07,79.42l18.39-9.67,7.39-14.14L26.08,62.8l-1.51.85ZM53.29,42,71.44,31.85l7-14.32L65.88,25.05l-1.48.88Z"
                    />
                </g>
                </g>
            </svg>
            <span>
                <p className='font-azonix'>
                SPARK Inc. &copy; 2024
                </p>
            Turning Ideas into Impact since... forever!
            </span>
        </aside>
        <nav className="md:place-self-center md:justify-self-end">
            <div className="grid grid-flow-col gap-4">
            
            <a>
                <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current">
                <path
                    d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
            </a>
            <a>
                <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current">
                <path
                    d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                </svg>
            </a>
            <a>
                <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current">
                <path
                    d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
                </svg>
            </a>
            </div>
        </nav>
        </footer>
    </section>
)
}

export default Footer
