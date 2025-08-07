import React from 'react'
import Clock from './clock'

const Time = () => {
    return (
        <section className='flex justify-between items-center px-40 md:px-32 my-28 lg:px-44 bg-black dark:invert text-background -mx-40'>
        <div className='flex flex-col items-start justify-start  '> 
            <h2 className="font-heading text-3xl pt-5  sm:text-2xl md:text-6xl flex items-center justify-center pb-7 dark:invert">
                Time
            </h2>
            <h2 className="max-w-[70%] md:max-w-[100%] font-heading text-lg -mt-4 sm:text-xl md:text-3xl flex items-center justify-center pb-7 dark:invert">
                We sell the origin of all vaules.
            </h2>
        </div>
        <Clock />
        </section>
    )
}

export default Time