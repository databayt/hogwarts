import React from 'react'
import Clock from './clock'
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface TimeProps {
    dictionary: Dictionary;
}

const Time = ({ dictionary }: TimeProps) => {
    const timeDict = (dictionary as any).time || { title: 'Time', subtitle: 'We sell the origin of value.' };

    return (
        <section className='flex justify-between items-center py-8 md:py-10 lg:py-12 my-40 bg-blue-600 text-white rounded-md'>
            <div className='flex flex-col items-start justify-start ps-12'>
                <h1 className="font-heading font-extrabold text-5xl pt-5 md:text-7xl flex items-center justify-center pb-7">
                    {timeDict.title}
                </h1>
                <p className="max-w-[70%] md:max-w-[100%] font-heading text-lg -mt-4 sm:text-xl md:text-2xl flex items-center justify-center pb-7">
                    {timeDict.subtitle}
                </p>
            </div>
            <div className="pe-12">
                <Clock />
            </div>
        </section>
    )
}

export default Time