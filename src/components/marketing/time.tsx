import React from 'react'
import Clock from './clock'
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface TimeProps {
    dictionary?: Dictionary
}

const Time = ({ dictionary }: TimeProps) => {
    const timeDict = dictionary?.marketing?.time || {
        title: "Time",
        subtitle: "We save the most valuable resource - your time."
    }
    return (
        <section className='full-bleed section bg-black dark:invert text-background'>
            <div className='inner-contained flex justify-between items-center'>
                <div className='flex flex-col items-start justify-start'>
                    <h2 className="font-heading pb-7 dark:invert">
                        {timeDict.title}
                    </h2>
                    <h3 className="max-w-[70%] md:max-w-[100%] font-heading -mt-4 pb-7 dark:invert">
                        {timeDict.subtitle}
                    </h3>
                </div>
                <Clock />
            </div>
        </section>
    )
}

export default Time