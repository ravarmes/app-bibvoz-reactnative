# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Regras do ProGuard para reduzir o tamanho do APK sem quebrar o aplicativo React Native

# Mantenha as anotações necessárias para o React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

# Não remova as anotações do Facebook
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}

# Mantenha os métodos nativos
-keepclassmembers class * {
    native <methods>;
}

# Preservar as seguintes classes para o React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.common.** { *; }
-keep class com.facebook.soloader.** { *; }

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Para evitar problemas com papel animado e outros componentes
-keep class com.swmansion.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Keep ADMob classes
-keep class com.google.android.gms.ads.** { *; }

# Para evitar problemas com Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# OkHttp3
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# Okio
-keep class sun.misc.Unsafe { *; }
-dontwarn java.nio.file.*
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-dontwarn okio.**

# JSR 305 annotations
-dontwarn javax.annotation.**

# Regras para ReactNativePaper e outros componentes visuais
-keep class com.reactnativepaper.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.views.** { *; }

# AsyncStorage regras
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Retrofit
-keepattributes Signature
-keepattributes Exceptions

# Mantenha tipos enumerados intactos
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Manter construtor chamado da classe enumerada
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Remover logs
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}
