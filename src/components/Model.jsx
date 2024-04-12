import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import ModelView from './ModelView';
import { models as defaultModels, sizes } from '../constants';
import { animateWithGsapTimeline } from '../utils/animations';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const Model = () => {
    const [size, setSize] = useState('small');
    const [modelIndex, setModelIndex] = useState(0);
    const [uploadingStates, setUploadingStates] = useState(Array(defaultModels.length).fill(false));

    const [crop, setCrop] = useState({ aspect: 1290 / 2796 });

    // Camera control for the model view
    const cameraControlSmall = useRef();
    const cameraControlLarge = useRef();

    // Model
    const small = useRef(new THREE.Group());
    const large = useRef(new THREE.Group());

    // Model rotation
    const [smallRotation, setSmallRotation] = useState(0);
    const [largeRotation, setLargeRotation] = useState(0);

    const tl = gsap.timeline();

    useEffect(() => {
        if (size === 'large') {
            animateWithGsapTimeline(tl, small, smallRotation, '#view1', '#view2', {
                transform: 'translateX(-100%)',
                duration: 2,
            });
        }

        if (size === 'small') {
            animateWithGsapTimeline(tl, large, largeRotation, '#view2', '#view1', {
                transform: 'translateX(0)',
                duration: 2,
            });
        }
    }, [size]);

    useGSAP(() => {
        gsap.to('#heading', {
            y: 0,
            opacity: 1,
        });
    }, []);

    const handleImageUpload = (event, index) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        setUploadingStates(prevStates => {
            const newStates = [...prevStates];
            newStates[index] = true;
            return newStates;
        });

        reader.onloadend = () => {
            const imageData = reader.result; // Base64 encoded image data
            // Create a new image element
            const image = new Image();
            image.src = imageData;

            // When the image is loaded
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                // Calculate dimensions for aspect ratio cropping
                const aspectRatio = 1290 / 2796; // Desired aspect ratio
                const imageAspectRatio = image.width / image.height;

                let width;
                let height;
                let startX = 0;
                let startY = 0;

                if (imageAspectRatio > aspectRatio) {
                    // Image is wider than desired aspect ratio
                    width = image.height * aspectRatio;
                    height = image.height;
                    startX = (image.width - width) / 2;
                } else {
                    // Image is taller than or equal to the desired aspect ratio
                    width = image.width;
                    height = image.width / aspectRatio;
                    startY = (image.height - height) / 2;
                }

                // Set canvas dimensions to desired crop size
                canvas.width = 1290;
                canvas.height = 2796;

                // Draw the cropped image onto the canvas
                context.drawImage(image, startX, startY, width, height, 0, 0, canvas.width, canvas.height);

                // Get the cropped image data URL
                const croppedImageData = canvas.toDataURL('image/jpeg');

                // Update the model with the cropped image
                const updatedModels = [...defaultModels];
                updatedModels[index].img = croppedImageData;
                setModelIndex(index);

                setUploadingStates(prevStates => {
                    const newStates = [...prevStates];
                    newStates[index] = false;
                    return newStates;
                });
            };
        };

        if (file) {
            reader.readAsDataURL(file); // Read the file as a Data URL
        }
    };

    return (
        <section className="common-padding">
            <div className="screen-max-width">
                <h1 id="heading" className="section-heading">
                    Take a closer look.
                </h1>

                <div className="flex flex-col items-center mt-5">
                    <div className="w-full h-[75vh] md:h-[90vh] overflow-hidden relative">
                        <ModelView
                            index={1}
                            groupRef={small}
                            gsapType="view1"
                            controlRef={cameraControlSmall}
                            setRotationState={setSmallRotation}
                            item={defaultModels[modelIndex]} // Use selected model
                            size={size}
                        />

                        <ModelView
                            index={2}
                            groupRef={large}
                            gsapType="view2"
                            controlRef={cameraControlLarge}
                            setRotationState={setLargeRotation}
                            item={defaultModels[modelIndex]} // Use selected model
                            size={size}
                        />

                        <Canvas
                            className="w-full h-full"
                            style={{
                                position: 'fixed',
                                top: 0,
                                bottom: 0,
                                left: 0,
                                right: 0,
                                overflow: 'hidden',
                            }}
                            eventSource={document.getElementById('root')}
                        >
                            <View.Port />
                        </Canvas>
                    </div>
                    <div className="mx-auto w-full">
                        <p className="text-sm font-light text-center mb-5">{defaultModels[modelIndex].title}</p>
                        <div className="flex-center">
                            <ul className="color-container">
                                {defaultModels.map((model, index) => (
                                    <div className='flex flex-col md:flex-row items-center gap-1 border-r-2 pr-2' key={index}>
                                        <li
                                            className="w-6 h-6 rounded-full mx-2 cursor-pointer"
                                            style={{
                                                backgroundColor: model.color[0],
                                            }}
                                            onClick={() => {
                                                setModelIndex(index)
                                            }}
                                        />

                                        {uploadingStates[index] ?
                                            <svg className="animate-spin" viewBox="0 0 100 101" width={20} height={20} xmlns="http://www.w3.org/2000/svg">
                                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#2997ff" />
                                            </svg>
                                            :
                                            <label htmlFor={`file-input-${index}`} className="cursor-pointer">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} id="upload">
                                                    <path fill="#2997ff" d="M8.71,7.71,11,5.41V15a1,1,0,0,0,2,0V5.41l2.29,2.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42l-4-4a1,1,0,0,0-.33-.21,1,1,0,0,0-.76,0,1,1,0,0,0-.33.21l-4,4A1,1,0,1,0,8.71,7.71ZM21,12a1,1,0,0,0-1,1v6a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V13a1,1,0,0,0-2,0v6a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V13A1,1,0,0,0,21,12Z" />
                                                </svg>
                                            </label>
                                        }


                                        <input
                                            type="file"
                                            accept="image/*"
                                            id={`file-input-${index}`}
                                            onChange={(event) => handleImageUpload(event, index)}
                                            disabled={uploadingStates[index]}
                                            style={{ display: 'none' }} // Hide the original input
                                        />
                                    </div>
                                ))}
                            </ul>
                            <button className="size-btn-container">
                                {sizes.map(({ label, value }) => (
                                    <span
                                        key={label}
                                        className="size-btn"
                                        style={{
                                            backgroundColor: size === value ? 'white' : 'transparent',
                                            color: size === value ? 'black' : 'white',
                                        }}
                                        onClick={() => setSize(value)}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default Model;
