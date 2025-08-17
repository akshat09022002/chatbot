import { useState } from 'react'
import { useNhostClient } from '@nhost/react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function SignUp() {
  const nhost = useNhostClient()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await nhost.auth.signUp({ email, password, options: { displayName } })
      if (error) setError(error.message)
      else navigate('/signin')
    } catch (err) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden"
    >
      {/* Background Animation Elements */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-32 right-32 w-36 h-36 bg-purple-500/10 rounded-full blur-xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 270, 180, 90, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-32 left-32 w-44 h-44 bg-indigo-500/10 rounded-full blur-xl"
      />

      <motion.div
        variants={formVariants}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <motion.div
          variants={itemVariants}
          className="text-center mb-8"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-2"
          >
            Create your account 🚀
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-300 text-lg"
          >
            Start your amazing journey with us
          </motion.p>
        </motion.div>

        <motion.form
          variants={itemVariants}
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <motion.div
            variants={itemVariants}
            className="space-y-2"
          >
            <motion.label
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="block text-sm font-medium text-slate-200"
            >
              Full name
            </motion.label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-900/60 border border-white/20 px-6 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all duration-300 shadow-lg"
              placeholder="Jane Doe"
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="space-y-2"
          >
            <motion.label
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="block text-sm font-medium text-slate-200"
            >
              Email
            </motion.label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-900/60 border border-white/20 px-6 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all duration-300 shadow-lg"
              placeholder="you@example.com"
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="space-y-2"
          >
            <motion.label
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="block text-sm font-medium text-slate-200"
            >
              Password
            </motion.label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl bg-slate-900/60 border border-white/20 px-6 py-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all duration-300 shadow-lg"
              placeholder="••••••••"
            />
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all duration-300 px-6 py-4 font-semibold text-white disabled:opacity-60 shadow-lg hover:shadow-indigo-500/25 disabled:shadow-none"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
              />
            ) : (
              "Create Account"
            )}
          </motion.button>
        </motion.form>

        <motion.div
          variants={itemVariants}
          className="mt-8 text-center"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-300"
          >
            Already have an account?{" "}
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-200"
                to="/signin"
              >
                Sign in
              </Link>
            </motion.span>
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

