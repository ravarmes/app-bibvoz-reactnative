import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const fadeOut   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade in logo + text
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(900),
      // Fade out entire screen
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, [fadeOut, onFinish, opacity]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <Animated.View style={[styles.content, { opacity }]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Animated.Text style={styles.title}>BibVoz</Animated.Text>
        <Animated.Text style={styles.subtitle}>Inglês pela Bíblia</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2D1B0E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 28,
    marginBottom: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F4EED8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#BA8A62',
    letterSpacing: 0.5,
  },
});
