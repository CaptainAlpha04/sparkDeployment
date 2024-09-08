import { useEffect, useState } from 'react';

const CountUp = ({ endValue }) => {
const [count, setCount] = useState(0);

useEffect(() => {
    let start = 0;
    const duration = 2000; // Duration in milliseconds (2 seconds)
    const stepTime = 50; // Interval between updates
    const steps = duration / stepTime;
    const increment = endValue / steps;

    const timer = setInterval(() => {
        start += increment;
        if (start >= endValue) {
        setCount(endValue);
        clearInterval(timer);
        } else {
            setCount(Math.round(start));
    }
    }, stepTime);

    return () => clearInterval(timer);
}, [endValue]);

return (
    <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600 mb-2">
        {count}
    </div>
);
};

export default CountUp;
