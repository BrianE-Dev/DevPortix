// src/pages/ProjectDetail.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Github, ExternalLink, Calendar, Tag, Eye, Star } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();

  // Mock project data - in real app, fetch based on id
  const project = {
    id: Number(id) || 1,
    title: "E-Commerce Platform",
    description: "A full-stack e-commerce solution built with modern technologies",
    longDescription: "This project is a complete e-commerce platform featuring user authentication, product management, shopping cart, payment integration, and admin dashboard. Built with scalability and performance in mind.",
    techStack: ["React", "Node.js", "Express", "MongoDB", "Redux", "Stripe", "JWT"],
    githubUrl: "#",
    liveUrl: "#",
    stars: 234,
    views: 1500,
    createdAt: "2024-01-15",
    updatedAt: "2024-02-20",
    features: [
      "User authentication & authorization",
      "Product search & filtering",
      "Shopping cart & checkout",
      "Payment integration with Stripe",
      "Admin dashboard",
      "Order tracking",
      "Product reviews & ratings",
      "Responsive design"
    ]
  };

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/#projects"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Projects
        </Link>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
              <p className="text-xl text-gray-300">{project.description}</p>
            </div>
            <div className="flex space-x-4 mt-4 lg:mt-0">
              <a
                href={project.githubUrl}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center"
              >
                <Github className="w-5 h-5 mr-2" />
                View Code
              </a>
              <a
                href={project.liveUrl}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition flex items-center"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Live Demo
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">About This Project</h2>
                <p className="text-gray-300 leading-relaxed">{project.longDescription}</p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Key Features</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Project Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-400">Created</div>
                      <div className="text-white">{project.createdAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-400">Updated</div>
                      <div className="text-white">{project.updatedAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-400">Views</div>
                      <div className="text-white">{project.views.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm text-gray-400">GitHub Stars</div>
                      <div className="text-white">{project.stars.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Tag className="w-5 h-5 text-gray-400 mr-2" />
                  Technology Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
