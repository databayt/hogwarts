export default function FAQs() {
    return (
        <section className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-y-12 px-2 lg:[grid-template-columns:1fr_auto]">
                    <div className="text-center lg:text-left">
                        <h2 className="mb-4 text-3xl font-semibold md:text-4xl">
                            Frequently <br className="hidden lg:block" /> Asked <br className="hidden lg:block" />
                            Questions
                        </h2>
                        <p>Your guide to joining Hogwarts.</p>
                    </div>

                    <div className="divide-y divide-dashed sm:mx-auto sm:max-w-lg lg:mx-0">
                        <div className="pb-6">
                            <h3 className="font-medium">How do I get my Hogwarts letter?</h3>
                            <p className="text-muted-foreground mt-4">Your Hogwarts letter will be delivered by owl post on your 11th birthday. If you haven&apos;t received it by then, please check with your local Ministry of Magic office.</p>

                            <ol className="list-outside list-decimal space-y-2 pl-4">
                                <li className="text-muted-foreground mt-4">Letters are automatically sent to all magical children on their birthday.</li>
                                <li className="text-muted-foreground mt-4">Muggle-born students may experience delays due to protective enchantments.</li>
                                <li className="text-muted-foreground mt-4">If your letter is lost, a Hogwarts representative will visit you personally.</li>
                            </ol>
                        </div>
                        <div className="py-6">
                            <h3 className="font-medium">What house will I be sorted into?</h3>
                            <p className="text-muted-foreground mt-4">The Sorting Hat will determine your house during the Welcome Feast. It considers your personality, values, and preferences to place you in Gryffindor, Hufflepuff, Ravenclaw, or Slytherin.</p>
                        </div>
                        <div className="py-6">
                            <h3 className="font-medium">What supplies do I need for school?</h3>
                            <p className="text-muted-foreground my-4">Your Hogwarts letter includes a complete list of required books and equipment. You can purchase everything at Diagon Alley.</p>
                            <ul className="list-outside list-disc space-y-2 pl-4">
                                <li className="text-muted-foreground">Standard spell books, cauldron, and magical ingredients</li>
                                <li className="text-muted-foreground">A wand from Ollivanders (the wand chooses the wizard!)</li>
                                <li className="text-muted-foreground">Robes, pointed hat, and protective gloves</li>
                                <li className="text-muted-foreground">Optional: owl, cat, or toad as a pet</li>
                            </ul>
                        </div>
                        <div className="py-6">
                            <h3 className="font-medium">How do I contact the school?</h3>
                            <p className="text-muted-foreground mt-4">You can send an owl to Hogwarts School, or use the Floo Network to speak with our admissions office. Muggle post is also accepted but may take longer to reach us.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}