import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';

interface CosmicWavesBackgroundProps {
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
  children?: React.ReactNode;
}

const { width, height } = Dimensions.get('window');

const CosmicWavesBackground: React.FC<CosmicWavesBackgroundProps> = ({ 
  intensity = 'medium',
  children 
}) => {
  // Animation values for multiple swirls
  const rotations = Array(8).fill(0).map(() => useRef(new Animated.Value(0)).current);
  const scales = Array(8).fill(0).map(() => useRef(new Animated.Value(1)).current);
  const opacities = Array(8).fill(0).map(() => useRef(new Animated.Value(0.5)).current);
  const distortions = Array(4).fill(0).map(() => useRef(new Animated.Value(0)).current);
  
  // Set animation speeds based on intensity - much slower for more fluid motion
  const getAnimationDuration = () => {
    switch (intensity) {
      case 'low': return { rotation: 80000, scale: 50000, opacity: 20000, distortion: 30000 };
      case 'high': return { rotation: 40000, scale: 25000, opacity: 10000, distortion: 15000 };
      case 'extreme': return { rotation: 30000, scale: 15000, opacity: 7000, distortion: 10000 };
      default: return { rotation: 60000, scale: 35000, opacity: 15000, distortion: 20000 };
    }
  };
  
  const durations = getAnimationDuration();
  
  // Define animation values based on intensity
  const scaleMax = intensity === 'low' ? 1.15 : (intensity === 'high' ? 1.4 : (intensity === 'extreme' ? 1.6 : 1.25));
  
  useEffect(() => {
    // Create swirly animations for each layer
    rotations.forEach((rotation, index) => {
      // Stagger the animations for more organic movement
      const direction = index % 2 === 0 ? 1 : -1;
      const speedFactor = 1 + (index * 0.15);
      
      // Rotation animation - continuous slow rotation
      Animated.loop(
        Animated.timing(rotation, {
          toValue: direction,
          duration: durations.rotation / speedFactor,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      // Scale animation - slow pulsing with different patterns
      if (index % 3 === 0) {
        // Simple pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(scales[index], {
              toValue: scaleMax - (index * 0.05),
              duration: durations.scale / speedFactor,
              easing: Easing.bezier(0.42, 0, 0.58, 1),
              useNativeDriver: true,
            }),
            Animated.timing(scales[index], {
              toValue: 1,
              duration: durations.scale / speedFactor,
              easing: Easing.bezier(0.42, 0, 0.58, 1),
              useNativeDriver: true,
            })
          ])
        ).start();
      } else if (index % 3 === 1) {
        // Bounce effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(scales[index], {
              toValue: scaleMax - (index * 0.03),
              duration: durations.scale / (speedFactor * 1.5),
              easing: Easing.bounce,
              useNativeDriver: true,
            }),
            Animated.timing(scales[index], {
              toValue: 1,
              duration: durations.scale / (speedFactor * 1.5),
              easing: Easing.elastic(1.5),
              useNativeDriver: true,
            })
          ])
        ).start();
      } else {
        // Elastic effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(scales[index], {
              toValue: scaleMax - (index * 0.04),
              duration: durations.scale / (speedFactor * 1.2),
              easing: Easing.elastic(2),
              useNativeDriver: true,
            }),
            Animated.timing(scales[index], {
              toValue: 0.95,
              duration: durations.scale / (speedFactor * 1.2),
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              useNativeDriver: true,
            })
          ])
        ).start();
      }
      
      // Opacity pulsing for extra trippy effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacities[index], {
            toValue: 0.8,
            duration: durations.opacity / (1 + (index * 0.2)),
            easing: Easing.bezier(0.42, 0, 0.58, 1),
            useNativeDriver: true,
          }),
          Animated.timing(opacities[index], {
            toValue: 0.3,
            duration: durations.opacity / (1 + (index * 0.2)),
            easing: Easing.bezier(0.42, 0, 0.58, 1),
            useNativeDriver: true,
          })
        ])
      ).start();
    });
    
    // Distortion animations for shape morphing
    distortions.forEach((distortion, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(distortion, {
            toValue: 1,
            duration: durations.distortion / (1 + (index * 0.3)),
            easing: Easing.bezier(0.42, 0, 0.58, 1),
            useNativeDriver: false, // Can't use native driver for non-transform/opacity props
          }),
          Animated.timing(distortion, {
            toValue: 0,
            duration: durations.distortion / (1 + (index * 0.3)),
            easing: Easing.bezier(0.42, 0, 0.58, 1),
            useNativeDriver: false,
          })
        ])
      ).start();
    });
  }, [intensity, scaleMax, durations.rotation, durations.scale, durations.opacity, durations.distortion]);
  
  // Calculate rotation degrees with different patterns for each layer
  const spins = rotations.map((rotation, index) => {
    return rotation.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['360deg', '0deg', '360deg']
    });
  });
  
  // Create swirl layers with different shapes, colors, and opacities
  const renderSwirlLayers = () => {
    // More complex and varied shapes for cosmic waves effect
    const swirlShapes = [
      { borderRadius: 70, opacity: 0.8 },
      { borderTopLeftRadius: 200, borderBottomRightRadius: 200, opacity: 0.7 },
      { borderTopRightRadius: 300, borderBottomLeftRadius: 100, opacity: 0.65 },
      { borderRadius: 150, borderTopRightRadius: 50, opacity: 0.6 },
      { borderRadius: 100, borderBottomLeftRadius: 300, opacity: 0.55 },
      { borderTopLeftRadius: 250, borderBottomRightRadius: 50, opacity: 0.5 },
      { borderRadius: 200, borderBottomRightRadius: 400, opacity: 0.45 },
      { borderTopRightRadius: 150, borderBottomLeftRadius: 350, opacity: 0.4 }
    ];
    
    // Modern vibrant color combinations
    const colorSets = [
      [colors.primary, colors.secondary, colors.accent, colors.primary] as const,
      [colors.accent, colors.primary, colors.highlight, colors.accent] as const,
      [colors.secondary, colors.accent, colors.primary, colors.highlight] as const,
      ['#3498db', '#9b59b6', '#00cec9', '#3498db'] as const, // Blue to purple to teal
      ['#e84393', '#3498db', '#00cec9', '#e84393'] as const, // Pink to blue to teal
      ['#4a69bd', '#e74c3c', '#00cec9', '#4a69bd'] as const, // Blue to red to teal
      ['#00cec9', '#9b59b6', '#3498db', '#00cec9'] as const, // Teal to purple to blue
      ['#3498db', '#e84393', '#00cec9', '#3498db'] as const  // Blue to pink to teal
    ];
    
    return rotations.map((_, index) => {
      // Calculate position offsets for more organic arrangement
      const offsetX = (index % 4 - 1.5) * width * 0.15;
      const offsetY = ((index + 1) % 4 - 1.5) * height * 0.15;
      
      // Dynamic border radius based on distortion animations
      const dynamicShape = { ...swirlShapes[index] };
      
      if (index < 4) {
        // Instead of directly assigning the animated value to borderRadius,
        // we'll use it in the style array where React Native can handle it properly
        return (
          <Animated.View
            key={`swirl-${index}`}
            style={[
              styles.swirlContainer,
              {
                opacity: opacities[index],
                transform: [
                  { translateX: offsetX },
                  { translateY: offsetY },
                  { rotate: spins[index] },
                  { scale: scales[index] }
                ]
              }
            ]}
          >
            <Animated.View
              style={{
                width: '100%',
                height: '100%',
                borderRadius: distortions[index].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [70, 300, 70]
                })
              }}
            >
              <LinearGradient
                colors={colorSets[index]}
                start={{ x: index % 2 === 0 ? 0 : 1, y: index % 3 === 0 ? 0 : 1 }}
                end={{ x: index % 2 === 0 ? 1 : 0, y: index % 3 === 0 ? 1 : 0 }}
                style={styles.swirlGradient}
              />
            </Animated.View>
          </Animated.View>
        );
      }
      
      // For other indices, use the original approach
      return (
        <Animated.View
          key={`swirl-${index}`}
          style={[
            styles.swirlContainer,
            dynamicShape,
            {
              opacity: opacities[index],
              transform: [
                { translateX: offsetX },
                { translateY: offsetY },
                { rotate: spins[index] },
                { scale: scales[index] }
              ]
            }
          ]}
        >
          <LinearGradient
            colors={colorSets[index]}
            start={{ x: index % 2 === 0 ? 0 : 1, y: index % 3 === 0 ? 0 : 1 }}
            end={{ x: index % 2 === 0 ? 1 : 0, y: index % 3 === 0 ? 1 : 0 }}
            style={styles.swirlGradient}
          />
        </Animated.View>
      );
    });
  };
  
  return (
    <View style={styles.container}>
      {renderSwirlLayers()}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  swirlContainer: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: 70,
    overflow: 'hidden',
  },
  swirlGradient: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    zIndex: 10,
  },
});

export default CosmicWavesBackground; 