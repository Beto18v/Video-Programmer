import Header from '@/components/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

interface Plan {
    id: number;
    name: string;
    display_name: string;
    description: string;
    price: number;
    video_limit: number | null;
    features: string[];
}

export default function Pricing({ plans = [] }: { plans?: Plan[] }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Precios">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <Header />

                <main className="flex-1">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
                                Elige tu plan
                            </h1>
                            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                                Selecciona el plan perfecto para tus necesidades
                                de programación de vídeos
                            </p>
                        </div>

                        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
                            {plans.map((plan) => (
                                <Card key={plan.id} className="relative">
                                    {plan.name === 'pro' && (
                                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                                            Más popular
                                        </Badge>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="text-2xl">
                                            {plan.display_name}
                                        </CardTitle>
                                        <CardDescription>
                                            {plan.description}
                                        </CardDescription>
                                        <div className="mt-4">
                                            <span className="text-4xl font-bold">
                                                ${plan.price}
                                            </span>
                                            <span className="text-gray-600 dark:text-gray-300">
                                                /mes
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            <li className="flex items-center">
                                                <span className="text-sm">
                                                    {plan.video_limit
                                                        ? `${plan.video_limit} vídeos`
                                                        : 'Vídeos ilimitados'}
                                                </span>
                                            </li>
                                            {plan.features.map(
                                                (feature, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-center"
                                                    >
                                                        <span className="text-sm">
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            variant={
                                                plan.name === 'pro'
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                        >
                                            {auth.user
                                                ? 'Suscribirse'
                                                : 'Comenzar'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
